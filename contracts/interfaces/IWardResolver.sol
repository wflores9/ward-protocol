// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IWardResolver — Ward Protocol resolution standard
/// @notice Interface for deterministic default resolution on XRPL EVM Sidechain.
///
/// Ward never holds keys, never signs, never executes transfers.
/// All resolution functions return unsigned data; the institution signs and submits.
/// ward_signed = false — always.
interface IWardResolver {
    // ── Structs ──────────────────────────────────────────────────────────────

    /// @notice On-chain policy certificate (mirrors XRPL NFT URI metadata).
    struct PolicyCertificate {
        bytes32 tokenId;        // NFToken ID (XRPL XLS-20)
        address vaultAddress;   // Bound vault — cross-vault claims rejected
        uint256 coverageAmount; // Policy coverage in RLUSD wei
        uint256 expiry;         // Unix timestamp (from XRPL ledger close_time)
        address poolAddress;    // Coverage pool
        bool isTransferable;    // Must be false for valid Ward policies
    }

    /// @notice Claim input submitted by a claimant.
    struct ClaimInput {
        address claimant;
        bytes32 nftTokenId;
        address defaultedVault;
        bytes32 loanId;
        address poolAddress;
    }

    /// @notice Result returned by resolveClaimUnsigned().
    /// ward_signed is always false — enforced at the contract level.
    struct ResolutionResult {
        bool approved;
        uint8 stepsPassed;       // 0–9
        uint256 payoutAmount;    // RLUSD wei; 0 if not approved
        string rejectionReason;  // empty if approved
        bool wardSigned;         // invariant: always false
    }

    /// @notice Unsigned escrow payload for institution signing.
    struct UnsignedEscrowPayload {
        address pool;
        address claimant;
        uint256 amount;
        bytes32 conditionHash;
        uint256 finishAfter;
        uint256 cancelAfter;
        bool wardSigned;         // invariant: always false
    }

    // ── Events ───────────────────────────────────────────────────────────────

    event ClaimResolved(
        bytes32 indexed nftTokenId,
        address indexed claimant,
        bool approved,
        uint256 payoutAmount,
        uint8 stepsPassed
    );

    event ClaimRejected(
        bytes32 indexed nftTokenId,
        uint8 atStep,
        string reason
    );

    // ── Core resolution ──────────────────────────────────────────────────────

    /// @notice Run all nine on-chain checks and return an unsigned resolution.
    /// @dev    Never executes a transfer. Returns data for institution signing.
    ///         ward_signed is always false in the returned struct.
    /// @param  claim  Claim inputs (all addresses must be non-zero).
    /// @return result ResolutionResult with wardSigned=false always.
    function resolveClaimUnsigned(
        ClaimInput calldata claim
    ) external view returns (ResolutionResult memory result);

    /// @notice Build an unsigned escrow payload for a pre-validated claim.
    /// @dev    Caller must call resolveClaimUnsigned() first and verify approved=true.
    ///         ward_signed is always false in the returned struct.
    function buildUnsignedEscrow(
        ClaimInput calldata claim,
        uint256 payoutAmount,
        bytes32 conditionHash,
        uint256 disputeWindowSeconds
    ) external view returns (UnsignedEscrowPayload memory payload);

    // ── Individual check queries (for audit / conformance testing) ───────────

    function checkPolicyNFT(
        address claimant,
        bytes32 nftTokenId
    ) external view returns (bool passed, string memory reason);

    function checkPolicyExpiry(
        bytes32 nftTokenId
    ) external view returns (bool passed, string memory reason);

    function checkVaultBinding(
        bytes32 nftTokenId,
        address defaultedVault
    ) external view returns (bool passed, string memory reason);

    function checkDefaultFlag(
        bytes32 loanId
    ) external view returns (bool passed, uint256 vaultLoss);

    function checkVaultLoss(
        bytes32 loanId
    ) external view returns (bool passed, string memory reason);

    function checkPoolCoverage(
        address poolAddress,
        uint256 requiredAmount
    ) external view returns (bool passed, string memory reason);

    function checkNFTLive(
        address claimant,
        bytes32 nftTokenId
    ) external view returns (bool passed, string memory reason);

    function checkClaimantHoldsNFT(
        address claimant,
        bytes32 nftTokenId
    ) external view returns (bool passed, string memory reason);

    function checkPoolSolvency(
        address poolAddress,
        uint256 payoutAmount
    ) external view returns (bool passed, string memory reason);
}
