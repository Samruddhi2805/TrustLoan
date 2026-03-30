import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contract/contracts",
    tests: "./contract/test",
    artifacts: "./contract/artifacts",
    cache: "./contract/cache"
  },
  networks: {
    polygonTestnet: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
