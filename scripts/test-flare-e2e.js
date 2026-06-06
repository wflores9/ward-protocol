/**
 * scripts/test-flare-e2e.js — Full Ward resolution E2E on Flare Coston2
 *
 * Runs the complete nine-check resolution flow against a live WardResolver
 * deployment on Flare Coston2 testnet. No mocks — all calls hit the chain.
 *
 * Usage:
 *   WARD_RESOLVER=0x<address> npx hardhat run scripts/test-flare-e2e.js --network coston2
 *
 * Prerequisites:
 *   - WardResolver deployed (run deploy-flare.js first)
 *   - WARD_RESOLVER env var set to deployed address
 *   - DEPLOYER_PRIVATE_KEY set in .env
 *
 * Flow:
 *   1. Register a test policy (registerPolicy)
 *   2. Record a simulated default (recordDefault)
 *   3. Fund the coverage pool (setPoolBalance)
 *   4. Call resolveClaimUnsigned — all nine checks must pass
 *   5. Assert wardSigned = false
 *   6. Call buildUnsignedEscrow — verify wardSigned = false
 *   7. Log all transaction hashes and on-chain state
 *
 * ward_signed = False — this script never signs a resolution transaction.
 * It verifies Ward returns unsigned payloads for institution signing.
 */

const { ethers } = require("hardhat");

const WARD_RESOLVER_ADDRESS = process.env.WARD_RESOLVER;

// Test parameters — deterministic values for reproducible E2E
const TEST_NFT_TOKEN_ID = ethers.keccak256(ethers.toUtf8Bytes("ward-e2e-flare-nft-001"));
const TEST_LOAN_ID = ethers.keccak256(ethers.toUtf8Bytes("ward-e2e-flare-loan-001"));
const COVERAGE_AMOUNT = ethers.parseEther("1000"); // 1000 RLUSD
const LOSS_AMOUNT = ethers.parseEther("500");       // 500 RLUSD
const POOL_BALANCE = ethers.parseEther("800");      // 800 RLUSD — meets 1.5× on loss
const DISPUTE_WINDOW = 172800;                      // 48h

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
}

async function main() {
  if (!WARD_RESOLVER_ADDRESS) {
    throw new Error(
      "WARD_RESOLVER env var not set.\n" +
        "Run: WARD_RESOLVER=0x<address> npx hardhat run scripts/test-flare-e2e.js --network coston2"
    );
  }

  const [deployer, claimant] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  Ward Protocol — Flare Coston2 E2E Test");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Network:     ${network.name} (chain ID ${network.chainId})`);
  console.log(`  Resolver:    ${WARD_RESOLVER_ADDRESS}`);
  console.log(`  Deployer:    ${deployer.address}`);
  console.log(`  Claimant:    ${claimant.address}`);
  console.log(`  NFT Token:   ${TEST_NFT_TOKEN_ID}`);
  console.log(`  Loan ID:     ${TEST_LOAN_ID}`);
  console.log("───────────────────────────────────────────────────────");

  const resolver = await ethers.getContractAt("WardResolver", WARD_RESOLVER_ADDRESS);

  // ── Step 1: Register test policy ─────────────────────────────────────────
  console.log("\n  [1/7] Registering test policy...");
  const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
  const tx1 = await resolver.registerPolicy(
    TEST_NFT_TOKEN_ID,
    deployer.address,     // vault address
    COVERAGE_AMOUNT,
    expiryTimestamp,
    deployer.address,     // pool address
    claimant.address,     // policy holder
  );
  const r1 = await tx1.wait();
  console.log(`  ✓ Policy registered  tx=${tx1.hash}  block=${r1.blockNumber}`);

  // ── Step 2: Record simulated default ─────────────────────────────────────
  console.log("\n  [2/7] Recording loan default...");
  const tx2 = await resolver.recordDefault(TEST_LOAN_ID, LOSS_AMOUNT);
  const r2 = await tx2.wait();
  console.log(`  ✓ Default recorded   tx=${tx2.hash}  block=${r2.blockNumber}`);
  console.log(`    Loss: ${ethers.formatEther(LOSS_AMOUNT)} RLUSD`);

  // ── Step 3: Fund coverage pool ────────────────────────────────────────────
  console.log("\n  [3/7] Setting pool balance...");
  const tx3 = await resolver.setPoolBalance(deployer.address, POOL_BALANCE);
  const r3 = await tx3.wait();
  console.log(`  ✓ Pool funded        tx=${tx3.hash}  block=${r3.blockNumber}`);
  console.log(`    Balance: ${ethers.formatEther(POOL_BALANCE)} RLUSD (${(Number(POOL_BALANCE) / Number(LOSS_AMOUNT)).toFixed(2)}× coverage)`);

  // ── Step 4: Run nine-check resolution ────────────────────────────────────
  console.log("\n  [4/7] Running nine-check resolution (view — no gas for state)...");
  const claim = {
    claimant: claimant.address,
    nftTokenId: TEST_NFT_TOKEN_ID,
    defaultedVault: deployer.address,
    loanId: TEST_LOAN_ID,
    poolAddress: deployer.address,
  };
  const result = await resolver.resolveClaimUnsigned(claim);

  console.log(`  Result:`);
  console.log(`    approved:        ${result.approved}`);
  console.log(`    stepsPassed:     ${result.stepsPassed}/9`);
  console.log(`    payoutAmount:    ${ethers.formatEther(result.payoutAmount)} RLUSD`);
  console.log(`    wardSigned:      ${result.wardSigned}`);
  console.log(`    rejectionReason: "${result.rejectionReason}"`);

  // ── Step 5: Assert ward_signed = false ───────────────────────────────────
  console.log("\n  [5/7] Asserting ward_signed = false...");
  assert(result.wardSigned === false, "wardSigned must be false on ResolutionResult");
  assert(result.approved === true, `Claim rejected: ${result.rejectionReason}`);
  assert(result.stepsPassed === 9n, `Expected 9 steps passed, got ${result.stepsPassed}`);
  assert(result.payoutAmount > 0n, "Payout amount must be > 0");
  console.log("  ✓ ward_signed = false  (invariant holds)");
  console.log("  ✓ All nine checks passed on-chain");

  // ── Step 6: Build unsigned escrow payload ─────────────────────────────────
  console.log("\n  [6/7] Building unsigned escrow payload...");
  const conditionHash = ethers.keccak256(ethers.toUtf8Bytes("ward-e2e-condition-001"));
  const payload = await resolver.buildUnsignedEscrow(
    claim,
    result.payoutAmount,
    conditionHash,
    DISPUTE_WINDOW,
  );

  console.log(`  Payload:`);
  console.log(`    pool:         ${payload.pool}`);
  console.log(`    claimant:     ${payload.claimant}`);
  console.log(`    amount:       ${ethers.formatEther(payload.amount)} RLUSD`);
  console.log(`    wardSigned:   ${payload.wardSigned}`);
  console.log(`    finishAfter:  +${DISPUTE_WINDOW / 3600}h from now`);

  // ── Step 7: Assert escrow payload ward_signed = false ─────────────────────
  console.log("\n  [7/7] Asserting escrow payload ward_signed = false...");
  assert(payload.wardSigned === false, "wardSigned must be false on UnsignedEscrowPayload");
  assert(payload.pool === deployer.address, "Escrow pool mismatch");
  assert(payload.claimant === claimant.address, "Escrow claimant mismatch");
  assert(payload.amount === result.payoutAmount, "Escrow amount mismatch");
  console.log("  ✓ ward_signed = false  (invariant holds on escrow payload)");

  // ── Summary ───────────────────────────────────────────────────────────────
  const explorerBase = "https://coston2-explorer.flare.network";
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  E2E PASSED — All assertions green");
  console.log("═══════════════════════════════════════════════════════");
  console.log("\n  On-chain transactions:");
  console.log(`    registerPolicy:  ${explorerBase}/tx/${tx1.hash}`);
  console.log(`    recordDefault:   ${explorerBase}/tx/${tx2.hash}`);
  console.log(`    setPoolBalance:  ${explorerBase}/tx/${tx3.hash}`);
  console.log("\n  Record for docs/testnet/flare-coston2.md:");
  console.log(`    CONTRACT_ADDRESS=${WARD_RESOLVER_ADDRESS}`);
  console.log(`    E2E_REGISTER_TX=${tx1.hash}`);
  console.log(`    E2E_DEFAULT_TX=${tx2.hash}`);
  console.log(`    E2E_POOL_TX=${tx3.hash}`);
  console.log(`    STEPS_PASSED=${result.stepsPassed}`);
  console.log(`    PAYOUT=${ethers.formatEther(result.payoutAmount)} RLUSD`);
  console.log(`    WARD_SIGNED=${result.wardSigned}`);
  console.log("═══════════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n  E2E FAILED:", err.message);
    process.exit(1);
  });
