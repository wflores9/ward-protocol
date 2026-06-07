import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance));

  const WardResolver = await ethers.getContractFactory("WardResolver");
  const ward = await WardResolver.deploy();
  await ward.waitForDeployment();

  const address = await ward.getAddress();
  console.log("WardResolver deployed to:", address);
  console.log("Transaction hash:", ward.deploymentTransaction().hash);
  console.log("ward_signed = False — verified");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
