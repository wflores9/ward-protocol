import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import "dotenv/config";

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "0x0000000000000000000000000000000000000000000000000000000000000001";

export default {
  plugins: [hardhatEthers],
  solidity: "0.8.20",
  networks: {
    coston2: {
      type: "http",
      url: "https://coston2-api.flare.network/ext/C/rpc",
      chainId: 114,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    xrplevm: {
      type: "http",
      url: "https://rpc.testnet.xrplevm.org",
      chainId: 1449000,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    xdc: {
      type: "http",
      url: "https://erpc.apothem.network",
      chainId: 51,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    base: {
      type: "http",
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    arbitrum: {
      type: "http",
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    polygon: {
      type: "http",
      url: "https://polygon-amoy.drpc.org",
      chainId: 80002,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    bnb: {
      type: "http",
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    avalanche: {
      type: "http",
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    sepolia: {
      type: "http",
      url: "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
  },
};
