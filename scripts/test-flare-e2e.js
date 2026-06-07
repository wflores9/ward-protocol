import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const addr = process.env.WARD_RESOLVER;
  if (!addr) throw new Error("Set WARD_RESOLVER env var");

  const ward = await ethers.getContractAt("WardResolver", addr);
  console.log("Connected to WardResolver at:", addr);

  const signed = await ward.wardSigned();
  console.log("wardSigned():", signed, "— must be false");
  if (signed !== false) throw new Error("INVARIANT VIOLATED: ward_signed must be false");

  const [signer] = await ethers.getSigners();
  const claimant = signer.address;
  const vault = "0x000000000000000000000000000000000000dEaD";
  const policyId = 281;

  const [valid, reason] = await ward.resolveClaimUnsigned(claimant, vault, policyId);
  console.log("Valid claim →", valid, "|", reason);

  const [v2, r2] = await ward.resolveClaimUnsigned(claimant, vault, 0);
  console.log("Zero policy →", v2, "|", r2);

  const [v3, r3] = await ward.resolveClaimUnsigned(claimant, ethers.ZeroAddress, policyId);
  console.log("Zero vault →", v3, "|", r3);

  console.log("\nE2E complete — ward_signed = False throughout");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
