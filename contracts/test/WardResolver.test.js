/**
 * WardResolver.test.js — Hardhat test suite for WardResolver.sol
 *
 * Tests all nine on-chain checks individually and the full resolution path.
 * ward_signed = false assertion on every resolution and escrow payload.
 *
 * Run: npx hardhat test test/WardResolver.test.js
 * (Requires: npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox)
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

// ── Constants mirroring ward/constants.py ──────────────────────────────────

const WARD_POLICY_TAXON = 281;
const LSF_LOAN_DEFAULT = 0x00010000;
const MIN_COVERAGE_RATIO = 1.5;
const CLAIM_RATE_LIMIT_MAX = 3;
const CLAIM_RATE_LIMIT_WINDOW = 300;

// ── Helpers ────────────────────────────────────────────────────────────────

function randomBytes32() {
  return ethers.hexlify(ethers.randomBytes(32));
}

async function deployResolver() {
  const [owner, pool, claimant, vault, attacker] = await ethers.getSigners();

  // Deploy a mock RLUSD ERC-20 (address only needed for constructor)
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const rlusd = await MockERC20.deploy("RLUSD", "RLUSD");

  const WardResolver = await ethers.getContractFactory("WardResolver");
  const resolver = await WardResolver.deploy(await rlusd.getAddress());

  return { resolver, rlusd, owner, pool, claimant, vault, attacker };
}

async function setupValidClaim(resolver, pool, claimant, vault) {
  const nftTokenId = randomBytes32();
  const loanId = randomBytes32();
  const coverage = ethers.parseEther("1000"); // 1000 RLUSD
  const loss = ethers.parseEther("500");      // 500 RLUSD
  const expiry = Math.floor(Date.now() / 1000) + 86400; // 24h from now

  // Register policy
  await resolver.registerPolicy(
    nftTokenId,
    vault.address,
    coverage,
    expiry,
    pool.address,
    claimant.address
  );

  // Record default
  await resolver.recordDefault(loanId, loss);

  // Fund pool (1.5× minimum: 750 RLUSD)
  await resolver.setPoolBalance(pool.address, ethers.parseEther("750"));

  const claim = {
    claimant: claimant.address,
    nftTokenId,
    defaultedVault: vault.address,
    loanId,
    poolAddress: pool.address,
  };

  return { claim, nftTokenId, loanId, coverage, loss };
}

// ── Test suite ─────────────────────────────────────────────────────────────

describe("WardResolver", function () {
  // ── Deployment ────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("deploys with correct RLUSD address", async function () {
      const { resolver, rlusd } = await deployResolver();
      expect(await resolver.rlusd()).to.equal(await rlusd.getAddress());
    });

    it("constants match Ward Python SDK values", async function () {
      const { resolver } = await deployResolver();
      expect(await resolver.WARD_POLICY_TAXON()).to.equal(WARD_POLICY_TAXON);
      expect(await resolver.LSF_LOAN_DEFAULT()).to.equal(LSF_LOAN_DEFAULT);
      expect(await resolver.CLAIM_RATE_LIMIT_MAX()).to.equal(CLAIM_RATE_LIMIT_MAX);
      expect(await resolver.CLAIM_RATE_LIMIT_WINDOW()).to.equal(CLAIM_RATE_LIMIT_WINDOW);
    });
  });

  // ── ward_signed invariant ─────────────────────────────────────────────────

  describe("ward_signed invariant", function () {
    it("resolveClaimUnsigned always returns wardSigned=false", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const result = await resolver.resolveClaimUnsigned(claim);
      expect(result.wardSigned).to.equal(false);
    });

    it("wardSigned=false even on rejected claims", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      // Submit without setup — all checks will fail
      const claim = {
        claimant: claimant.address,
        nftTokenId: randomBytes32(),
        defaultedVault: vault.address,
        loanId: randomBytes32(),
        poolAddress: pool.address,
      };
      const result = await resolver.resolveClaimUnsigned(claim);
      expect(result.wardSigned).to.equal(false);
    });

    it("buildUnsignedEscrow always returns wardSigned=false", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const payload = await resolver.buildUnsignedEscrow(
        claim,
        ethers.parseEther("500"),
        randomBytes32(),
        172800 // 48h dispute window
      );
      expect(payload.wardSigned).to.equal(false);
    });
  });

  // ── Full resolution path ──────────────────────────────────────────────────

  describe("Full nine-check resolution", function () {
    it("approves a valid claim with all 9 steps passed", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const result = await resolver.resolveClaimUnsigned(claim);
      expect(result.approved).to.equal(true);
      expect(result.stepsPassed).to.equal(9);
      expect(result.wardSigned).to.equal(false);
      expect(result.payoutAmount).to.be.gt(0n);
    });

    it("payout is capped at coverage amount", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const nftTokenId = randomBytes32();
      const loanId = randomBytes32();
      const coverage = ethers.parseEther("300");
      const loss = ethers.parseEther("500"); // loss > coverage
      const expiry = Math.floor(Date.now() / 1000) + 86400;

      await resolver.registerPolicy(nftTokenId, vault.address, coverage, expiry, pool.address, claimant.address);
      await resolver.recordDefault(loanId, loss);
      await resolver.setPoolBalance(pool.address, ethers.parseEther("1000"));

      const claim = { claimant: claimant.address, nftTokenId, defaultedVault: vault.address, loanId, poolAddress: pool.address };
      const result = await resolver.resolveClaimUnsigned(claim);
      expect(result.payoutAmount).to.equal(coverage);
    });
  });

  // ── Individual check tests ────────────────────────────────────────────────

  describe("Step 1 — Policy NFT", function () {
    it("passes when claimant holds a registered NFT", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkPolicyNFT(claim.claimant, claim.nftTokenId);
      expect(passed).to.equal(true);
    });

    it("fails when NFT not registered", async function () {
      const { resolver, claimant } = await deployResolver();
      const [passed, reason] = await resolver.checkPolicyNFT(claimant.address, randomBytes32());
      expect(passed).to.equal(false);
      expect(reason).to.not.equal("");
    });

    it("fails when NFT holder is different address", async function () {
      const { resolver, pool, claimant, vault, attacker } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkPolicyNFT(attacker.address, claim.nftTokenId);
      expect(passed).to.equal(false);
    });
  });

  describe("Step 2 — Policy Expiry", function () {
    it("passes when policy has not expired", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkPolicyExpiry(claim.nftTokenId);
      expect(passed).to.equal(true);
    });

    it("fails when policy is expired", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const nftTokenId = randomBytes32();
      const pastExpiry = Math.floor(Date.now() / 1000) - 1000;
      await resolver.registerPolicy(nftTokenId, vault.address, ethers.parseEther("1000"), pastExpiry, pool.address, claimant.address);
      const [passed, reason] = await resolver.checkPolicyExpiry(nftTokenId);
      expect(passed).to.equal(false);
      expect(reason).to.include("expired");
    });
  });

  describe("Step 3 — Vault Binding", function () {
    it("passes when NFT vault matches defaulted vault", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkVaultBinding(claim.nftTokenId, claim.defaultedVault);
      expect(passed).to.equal(true);
    });

    it("fails cross-vault claim — policy covers different vault", async function () {
      const { resolver, pool, claimant, vault, attacker } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed, reason] = await resolver.checkVaultBinding(claim.nftTokenId, attacker.address);
      expect(passed).to.equal(false);
      expect(reason).to.include("Cross-vault");
    });
  });

  describe("Step 4 — Default Flag", function () {
    it("passes when LSF_LOAN_DEFAULT is set", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkDefaultFlag(claim.loanId);
      expect(passed).to.equal(true);
    });

    it("fails when default flag not set", async function () {
      const { resolver } = await deployResolver();
      const [passed] = await resolver.checkDefaultFlag(randomBytes32());
      expect(passed).to.equal(false);
    });
  });

  describe("Step 5 — Vault Loss", function () {
    it("passes when vault loss > 0", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkVaultLoss(claim.loanId);
      expect(passed).to.equal(true);
    });

    it("fails when no default recorded", async function () {
      const { resolver } = await deployResolver();
      const [passed] = await resolver.checkVaultLoss(randomBytes32());
      expect(passed).to.equal(false);
    });
  });

  describe("Step 6 — Pool Coverage", function () {
    it("passes when pool balance covers required amount", async function () {
      const { resolver, pool } = await deployResolver();
      await resolver.setPoolBalance(pool.address, ethers.parseEther("1000"));
      const [passed] = await resolver.checkPoolCoverage(pool.address, ethers.parseEther("500"));
      expect(passed).to.equal(true);
    });

    it("fails when pool balance insufficient", async function () {
      const { resolver, pool } = await deployResolver();
      await resolver.setPoolBalance(pool.address, ethers.parseEther("100"));
      const [passed, reason] = await resolver.checkPoolCoverage(pool.address, ethers.parseEther("500"));
      expect(passed).to.equal(false);
      expect(reason).to.include("insufficient");
    });
  });

  describe("Step 7 — NFT Live (replay protection)", function () {
    it("passes when NFT has not been burned", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkNFTLive(claim.claimant, claim.nftTokenId);
      expect(passed).to.equal(true);
    });

    it("fails after NFT is burned — replay protection active", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      await resolver.burnNFT(claim.nftTokenId);
      const [passed, reason] = await resolver.checkNFTLive(claim.claimant, claim.nftTokenId);
      expect(passed).to.equal(false);
      expect(reason).to.include("burned");
    });
  });

  describe("Step 8 — Claimant Holds NFT", function () {
    it("passes when claimant is current holder", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkClaimantHoldsNFT(claim.claimant, claim.nftTokenId);
      expect(passed).to.equal(true);
    });

    it("fails when attacker tries to claim with someone else's NFT", async function () {
      const { resolver, pool, claimant, vault, attacker } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const [passed] = await resolver.checkClaimantHoldsNFT(attacker.address, claim.nftTokenId);
      expect(passed).to.equal(false);
    });
  });

  describe("Step 9 — Pool Solvency", function () {
    it("passes when pool has 1.5× coverage ratio", async function () {
      const { resolver, pool } = await deployResolver();
      await resolver.setPoolBalance(pool.address, ethers.parseEther("750"));
      const [passed] = await resolver.checkPoolSolvency(pool.address, ethers.parseEther("500"));
      expect(passed).to.equal(true);
    });

    it("fails when coverage ratio below 1.5×", async function () {
      const { resolver, pool } = await deployResolver();
      await resolver.setPoolBalance(pool.address, ethers.parseEther("600")); // 1.2× — below min
      const [passed, reason] = await resolver.checkPoolSolvency(pool.address, ethers.parseEther("500"));
      expect(passed).to.equal(false);
      expect(reason).to.include("1.5x");
    });

    it("fails when payout is zero", async function () {
      const { resolver, pool } = await deployResolver();
      const [passed] = await resolver.checkPoolSolvency(pool.address, 0n);
      expect(passed).to.equal(false);
    });
  });

  // ── Rejection paths ───────────────────────────────────────────────────────

  describe("Rejection paths", function () {
    it("rejects at step 1 for unregistered NFT", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const claim = {
        claimant: claimant.address,
        nftTokenId: randomBytes32(),
        defaultedVault: vault.address,
        loanId: randomBytes32(),
        poolAddress: pool.address,
      };
      const result = await resolver.resolveClaimUnsigned(claim);
      expect(result.approved).to.equal(false);
      expect(result.stepsPassed).to.equal(0);
      expect(result.wardSigned).to.equal(false);
    });

    it("rejects cross-vault claim at step 3", async function () {
      const { resolver, pool, claimant, vault, attacker } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      const crossVaultClaim = { ...claim, defaultedVault: attacker.address };
      const result = await resolver.resolveClaimUnsigned(crossVaultClaim);
      expect(result.approved).to.equal(false);
      expect(result.stepsPassed).to.equal(2);
      expect(result.wardSigned).to.equal(false);
    });

    it("rejects when pool is insolvent at step 9", async function () {
      const { resolver, pool, claimant, vault } = await deployResolver();
      const { claim } = await setupValidClaim(resolver, pool, claimant, vault);
      await resolver.setPoolBalance(pool.address, 0n); // drain pool
      const result = await resolver.resolveClaimUnsigned(claim);
      expect(result.approved).to.equal(false);
      expect(result.stepsPassed).to.be.lt(9);
      expect(result.wardSigned).to.equal(false);
    });
  });
});
