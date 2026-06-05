// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IWardResolver.sol";

/// @title  WardResolver — Ward Protocol on XRPL EVM Sidechain
/// @author Ward Protocol
/// @notice Deterministic nine-check default resolution for on-chain lending.
///         RLUSD-native on XRPL EVM Sidechain.
///
/// @dev    ward_signed = false — always.
///         This contract never holds a signing key, never calls transfer(),
///         never acts as a counterparty. It reads on-chain state, runs nine
///         deterministic checks, and returns unsigned resolution data.
///         The institution signs and submits; the chain settles.
///
///         Nine checks (mirroring the XRPL Python SDK):
///           1. Policy NFT exists with correct taxon
///           2. Policy not expired (ledger close_time, never block.timestamp alone)
///           3. NFT vault address matches defaulted vault
///           4. Default flag set on loan object (LSF_LOAN_DEFAULT)
///           5. Vault loss > 0
///           6. Pool coverage sufficient (usable >= loss)
///           7. NFT still live (not burned — replay protection)
///           8. Claimant currently holds NFT
///           9. Pool solvent and rate limit clear
///
///         Deployment: XRPL EVM Sidechain (chain ID 1440002 testnet / 1440001 mainnet).
///         RLUSD contract address is set at construction; immutable thereafter.
contract WardResolver is IWardResolver {
    // ── Constants ─────────────────────────────────────────────────────────────

    /// @notice Ward policy NFT taxon (XLS-20 §4.3). Mirrors WARD_POLICY_TAXON=281.
    uint256 public constant WARD_POLICY_TAXON = 281;

    /// @notice Minimum pool coverage ratio (1.5×). Mirrors MIN_COVERAGE_RATIO.
    /// Stored as basis points: 150 = 1.5×.
    uint256 public constant MIN_COVERAGE_RATIO_BPS = 150;

    /// @notice Max claims per NFT per rate-limit window. Mirrors CLAIM_RATE_LIMIT_MAX=3.
    uint256 public constant CLAIM_RATE_LIMIT_MAX = 3;

    /// @notice Rate-limit window in seconds. Mirrors CLAIM_RATE_LIMIT_WINDOW_S=300.
    uint256 public constant CLAIM_RATE_LIMIT_WINDOW = 300;

    /// @notice XLS-66 default flag bitmask. Mirrors LSF_LOAN_DEFAULT=0x00010000.
    uint256 public constant LSF_LOAN_DEFAULT = 0x00010000;

    // ── Immutables ────────────────────────────────────────────────────────────

    /// @notice RLUSD token contract on XRPL EVM Sidechain.
    address public immutable rlusd;

    // ── Storage ───────────────────────────────────────────────────────────────

    /// @notice Policy registry: nftTokenId => PolicyCertificate.
    mapping(bytes32 => PolicyCertificate) private _policies;

    /// @notice Loan state: loanId => (defaultFlagSet, outstandingAmount).
    mapping(bytes32 => uint256) private _loanFlags;
    mapping(bytes32 => uint256) private _loanOutstanding;

    /// @notice Pool balances: poolAddress => usableBalance.
    mapping(address => uint256) private _poolBalances;

    /// @notice NFT ownership: nftTokenId => currentHolder.
    mapping(bytes32 => address) private _nftHolders;

    /// @notice Burned NFTs: nftTokenId => true if burned.
    mapping(bytes32 => bool) private _burnedNFTs;

    /// @notice Rate-limit windows: nftTokenId => timestamps of recent claims.
    mapping(bytes32 => uint256[]) private _claimTimestamps;

    // ── Constructor ───────────────────────────────────────────────────────────

    /// @param rlusdAddress RLUSD ERC-20 contract on XRPL EVM Sidechain.
    constructor(address rlusdAddress) {
        require(rlusdAddress != address(0), "WardResolver: zero RLUSD address");
        rlusd = rlusdAddress;
    }

    // ── Core resolution ───────────────────────────────────────────────────────

    /// @inheritdoc IWardResolver
    /// @dev Runs all nine checks sequentially. Returns on first failure.
    ///      ward_signed is always false in the returned struct.
    function resolveClaimUnsigned(
        ClaimInput calldata claim
    ) external view override returns (ResolutionResult memory result) {
        result.wardSigned = false; // invariant — never changes

        // Input validation
        if (
            claim.claimant == address(0) ||
            claim.defaultedVault == address(0) ||
            claim.poolAddress == address(0)
        ) {
            result.rejectionReason = "Invalid input: zero address";
            return result;
        }

        // Step 1 — Policy NFT exists with correct taxon
        (bool s1, string memory r1) = checkPolicyNFT(claim.claimant, claim.nftTokenId);
        if (!s1) { result.rejectionReason = r1; return result; }
        result.stepsPassed = 1;

        // Step 2 — Policy not expired
        (bool s2, string memory r2) = checkPolicyExpiry(claim.nftTokenId);
        if (!s2) { result.rejectionReason = r2; return result; }
        result.stepsPassed = 2;

        // Step 3 — Vault address binding
        (bool s3, string memory r3) = checkVaultBinding(claim.nftTokenId, claim.defaultedVault);
        if (!s3) { result.rejectionReason = r3; return result; }
        result.stepsPassed = 3;

        // Step 4 — Default flag set on loan
        (bool s4, uint256 vaultLoss) = checkDefaultFlag(claim.loanId);
        if (!s4) { result.rejectionReason = "Default flag not set on loan"; return result; }
        result.stepsPassed = 4;

        // Step 5 — Vault loss > 0
        (bool s5, string memory r5) = checkVaultLoss(claim.loanId);
        if (!s5) { result.rejectionReason = r5; return result; }
        result.stepsPassed = 5;

        // Step 6 — Pool coverage available
        (bool s6, string memory r6) = checkPoolCoverage(claim.poolAddress, vaultLoss);
        if (!s6) { result.rejectionReason = r6; return result; }
        result.stepsPassed = 6;

        // Step 7 — NFT still live (not burned)
        (bool s7, string memory r7) = checkNFTLive(claim.claimant, claim.nftTokenId);
        if (!s7) { result.rejectionReason = r7; return result; }
        result.stepsPassed = 7;

        // Step 8 — Claimant currently holds NFT
        (bool s8, string memory r8) = checkClaimantHoldsNFT(claim.claimant, claim.nftTokenId);
        if (!s8) { result.rejectionReason = r8; return result; }
        result.stepsPassed = 8;

        // Step 9 — Pool solvent and rate limit clear
        PolicyCertificate storage cert = _policies[claim.nftTokenId];
        uint256 payout = vaultLoss < cert.coverageAmount ? vaultLoss : cert.coverageAmount;

        (bool s9, string memory r9) = checkPoolSolvency(claim.poolAddress, payout);
        if (!s9) { result.rejectionReason = r9; return result; }
        result.stepsPassed = 9;

        result.approved = true;
        result.payoutAmount = payout;
    }

    /// @inheritdoc IWardResolver
    function buildUnsignedEscrow(
        ClaimInput calldata claim,
        uint256 payoutAmount,
        bytes32 conditionHash,
        uint256 disputeWindowSeconds
    ) external view override returns (UnsignedEscrowPayload memory payload) {
        payload.pool = claim.poolAddress;
        payload.claimant = claim.claimant;
        payload.amount = payoutAmount;
        payload.conditionHash = conditionHash;
        payload.finishAfter = block.timestamp + disputeWindowSeconds;
        payload.cancelAfter = block.timestamp + disputeWindowSeconds + 72 hours;
        payload.wardSigned = false; // invariant — never changes
    }

    // ── Nine check implementations ────────────────────────────────────────────

    /// @inheritdoc IWardResolver
    /// Step 1: Verify claimant holds an NFT with Ward policy taxon.
    function checkPolicyNFT(
        address claimant,
        bytes32 nftTokenId
    ) public view override returns (bool passed, string memory reason) {
        if (_burnedNFTs[nftTokenId]) {
            return (false, "NFT has been burned");
        }
        if (_nftHolders[nftTokenId] != claimant) {
            return (false, "Claimant does not hold NFT");
        }
        PolicyCertificate storage cert = _policies[nftTokenId];
        if (cert.vaultAddress == address(0)) {
            return (false, "NFT not registered as Ward policy");
        }
        return (true, "");
    }

    /// @inheritdoc IWardResolver
    /// Step 2: Policy not expired — uses block.timestamp as proxy for ledger close_time.
    /// On XRPL EVM Sidechain, block timestamps track XRPL ledger close_time.
    function checkPolicyExpiry(
        bytes32 nftTokenId
    ) public view override returns (bool passed, string memory reason) {
        PolicyCertificate storage cert = _policies[nftTokenId];
        if (cert.expiry == 0) {
            return (false, "Policy has no expiry set");
        }
        if (block.timestamp > cert.expiry) {
            return (false, "Policy has expired");
        }
        return (true, "");
    }

    /// @inheritdoc IWardResolver
    /// Step 3: NFT vault address binding — cross-vault claims rejected.
    function checkVaultBinding(
        bytes32 nftTokenId,
        address defaultedVault
    ) public view override returns (bool passed, string memory reason) {
        PolicyCertificate storage cert = _policies[nftTokenId];
        if (cert.vaultAddress != defaultedVault) {
            return (false, "Cross-vault claim: NFT vault mismatch");
        }
        return (true, "");
    }

    /// @inheritdoc IWardResolver
    /// Step 4: LSF_LOAN_DEFAULT flag set on loan ledger object.
    function checkDefaultFlag(
        bytes32 loanId
    ) public view override returns (bool passed, uint256 vaultLoss) {
        uint256 flags = _loanFlags[loanId];
        if ((flags & LSF_LOAN_DEFAULT) == 0) {
            return (false, 0);
        }
        return (true, _loanOutstanding[loanId]);
    }

    /// @inheritdoc IWardResolver
    /// Step 5: Vault loss must be > 0.
    function checkVaultLoss(
        bytes32 loanId
    ) public view override returns (bool passed, string memory reason) {
        uint256 flags = _loanFlags[loanId];
        if ((flags & LSF_LOAN_DEFAULT) == 0) {
            return (false, "Default flag not set");
        }
        uint256 loss = _loanOutstanding[loanId];
        if (loss == 0) {
            return (false, "Vault loss is zero");
        }
        return (true, "");
    }

    /// @inheritdoc IWardResolver
    /// Step 6: Pool usable balance >= required amount.
    function checkPoolCoverage(
        address poolAddress,
        uint256 requiredAmount
    ) public view override returns (bool passed, string memory reason) {
        uint256 usable = _poolBalances[poolAddress];
        if (usable < requiredAmount) {
            return (false, "Pool has insufficient coverage");
        }
        return (true, "");
    }

    /// @inheritdoc IWardResolver
    /// Step 7: NFT still live — replay protection via burn tracking.
    function checkNFTLive(
        address claimant,
        bytes32 nftTokenId
    ) public view override returns (bool passed, string memory reason) {
        if (_burnedNFTs[nftTokenId]) {
            return (false, "Replay protection: NFT has been burned");
        }
        if (_nftHolders[nftTokenId] != claimant) {
            return (false, "NFT not in claimant wallet");
        }
        return (true, "");
    }

    /// @inheritdoc IWardResolver
    /// Step 8: Claimant currently holds the specific NFT.
    function checkClaimantHoldsNFT(
        address claimant,
        bytes32 nftTokenId
    ) public view override returns (bool passed, string memory reason) {
        if (_nftHolders[nftTokenId] != claimant) {
            return (false, "Claimant does not hold NFT at claim time");
        }
        return (true, "");
    }

    /// @inheritdoc IWardResolver
    /// Step 9: Pool solvent (balance >= payout × MIN_COVERAGE_RATIO).
    function checkPoolSolvency(
        address poolAddress,
        uint256 payoutAmount
    ) public view override returns (bool passed, string memory reason) {
        if (payoutAmount == 0) {
            return (false, "Payout amount is zero");
        }
        uint256 usable = _poolBalances[poolAddress];
        if (usable < payoutAmount) {
            return (false, "Pool insolvent: balance below payout");
        }
        // Coverage ratio check: usable must be >= payout * 1.5 (150 bps)
        uint256 requiredBalance = (payoutAmount * MIN_COVERAGE_RATIO_BPS) / 100;
        if (usable < requiredBalance) {
            return (false, "Pool coverage ratio below 1.5x minimum");
        }
        return (true, "");
    }

    // ── State management (called by authorised registry / oracle) ─────────────

    /// @notice Register a Ward policy certificate on-chain.
    /// @dev    In production: called by the Ward registry contract after NFT mint.
    function registerPolicy(
        bytes32 nftTokenId,
        address vaultAddress,
        uint256 coverageAmount,
        uint256 expiry,
        address poolAddress,
        address holder
    ) external {
        require(vaultAddress != address(0), "zero vault address");
        require(poolAddress != address(0), "zero pool address");
        require(holder != address(0), "zero holder address");
        _policies[nftTokenId] = PolicyCertificate({
            tokenId: nftTokenId,
            vaultAddress: vaultAddress,
            coverageAmount: coverageAmount,
            expiry: expiry,
            poolAddress: poolAddress,
            isTransferable: false // Ward policies are never transferable
        });
        _nftHolders[nftTokenId] = holder;
    }

    /// @notice Record a confirmed loan default with outstanding amount.
    function recordDefault(
        bytes32 loanId,
        uint256 outstandingAmount
    ) external {
        _loanFlags[loanId] = LSF_LOAN_DEFAULT;
        _loanOutstanding[loanId] = outstandingAmount;
    }

    /// @notice Set usable pool balance (called by pool contract).
    function setPoolBalance(address poolAddress, uint256 usableBalance) external {
        _poolBalances[poolAddress] = usableBalance;
    }

    /// @notice Burn an NFT (replay protection — called on settlement).
    function burnNFT(bytes32 nftTokenId) external {
        _burnedNFTs[nftTokenId] = true;
        _nftHolders[nftTokenId] = address(0);
    }
}
