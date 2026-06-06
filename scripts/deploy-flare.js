/**
 * scripts/deploy-flare.js — Deploy WardResolver to Flare Coston2 testnet
 *
 * Usage:
 *   npx hardhat run scripts/deploy-flare.js --network coston2
 *
 * Prerequisites:
 *   - DEPLOYER_PRIVATE_KEY set in .env
 *   - RLUSD_ADDRESS set in .env (or use zero address for testnet placeholder)
 *   - Deployer account funded with C2FLR (Coston2 testnet FLR)
 *     Faucet: https://coston2-faucet.towolabs.com
 *
 * Outputs:
 *   - Deployed WardResolver contract address
 *   - Deployment transaction hash
 *   - Block number and timestamp
 *   - ward_signed = false assertion on deployed contract
 */

const { ethers } = require("hardhat");

// RLUSD ERC-20 on Flare Coston2 — use zero address as placeholder until Ripple publishes
const RLUSD_ADDRESS =
  process.env.RLUSD_ADDRESS || "0x0000000000000000000000000000000000000001";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════════════════");
  console.log("  Ward Protocol — WardResolver Deployment");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Network:   ${network.name} (chain ID ${network.chainId})`);
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(
    `  Balance:   ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} FLR`
  );
  console.log(`  RLUSD:     ${RLUSD_ADDRESS}`);
  console.log("───────────────────────────────────────────────────────");

  // Deploy WardResolver
  console.log("\n  Deploying WardResolver...");
  const WardResolver = await ethers.getContractFactory("WardResolver");
  const resolver = await WardResolver.deploy(RLUSD_ADDRESS);
  await resolver.waitForDeployment();

  const deployedAddress = await resolver.getAddress();
  const deployTx = resolver.deploymentTransaction();
  const receipt = await deployTx.wait();

  console.log("\n  ✓ WardResolver deployed");
  console.log(`    Address:   ${deployedAddress}`);
  console.log(`    Tx Hash:   ${deployTx.hash}`);
  console.log(`    Block:     ${receipt.blockNumber}`);

  // Verify core constants match Ward Python SDK
  const policyTaxon = await resolver.WARD_POLICY_TAXON();
  const lsfDefault = await resolver.LSF_LOAN_DEFAULT();
  const rateMax = await resolver.CLAIM_RATE_LIMIT_MAX();
  const rateWindow = await resolver.CLAIM_RATE_LIMIT_WINDOW();

  console.log("\n  Verifying on-chain constants...");
  console.log(`    WARD_POLICY_TAXON:    ${policyTaxon}  (expected 281)`);
  console.log(
    `    LSF_LOAN_DEFAULT:    0x${lsfDefault.toString(16).padStart(8, "0")}  (expected 0x00010000)`
  );
  console.log(`    CLAIM_RATE_LIMIT_MAX: ${rateMax}  (expected 3)`);
  console.log(`    CLAIM_RATE_LIMIT_WINDOW: ${rateWindow}s  (expected 300)`);

  if (
    policyTaxon !== 281n ||
    lsfDefault !== 0x00010000n ||
    rateMax !== 3n ||
    rateWindow !== 300n
  ) {
    throw new Error("Constants mismatch — deployment aborted");
  }
  console.log("  ✓ All constants verified");

  // Verify ward_signed = false on a sample resolution call
  const sampleClaim = {
    claimant: deployer.address,
    nftTokenId: ethers.ZeroHash,
    defaultedVault: deployer.address,
    loanId: ethers.ZeroHash,
    poolAddress: deployer.address,
  };
  const result = await resolver.resolveClaimUnsigned(sampleClaim);
  if (result.wardSigned !== false) {
    throw new Error("CRITICAL: wardSigned !== false — deployment aborted");
  }
  console.log("\n  ✓ ward_signed = false verified on-chain");

  // Explorer link
  const explorerBase = "https://coston2-explorer.flare.network";
  console.log("\n  Explorer links:");
  console.log(`    Contract: ${explorerBase}/address/${deployedAddress}`);
  console.log(`    Tx:       ${explorerBase}/tx/${deployTx.hash}`);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Deployment complete. Record these values:");
  console.log(`  CONTRACT_ADDRESS=${deployedAddress}`);
  console.log(`  DEPLOY_TX=${deployTx.hash}`);
  console.log(`  BLOCK=${receipt.blockNumber}`);
  console.log(`  CHAIN_ID=${network.chainId}`);
  console.log("═══════════════════════════════════════════════════════");

  return { deployedAddress, deployTxHash: deployTx.hash, blockNumber: receipt.blockNumber };
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n  ERROR:", err.message);
    process.exit(1);
  });
