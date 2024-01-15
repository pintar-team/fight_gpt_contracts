import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    testnet: {
      url: "https://data-seed-prebsc-2-s2.bnbchain.org:8545",
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  }
};

export default config;
