import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import configs from "./config/config";
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
      hardfork: "prague", // 👈 关键点：默认 network 是 hardhat，不是 localhost
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      hardfork: "prague",
    },
    sepolia: configs.sepolia
  },
  etherscan: {
    apiKey: configs.etherscan.apiKey,
  },
};

export default config;
