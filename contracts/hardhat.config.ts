import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { defaultSignerPrivateKey } from "./key";

const accounts = [process.env.PRIVATE_KEY || defaultSignerPrivateKey];

const config: HardhatUserConfig = {
  solidity: "0.8.23",
  networks: {
    hardhat: {
      forking: {
        url: "https://sepolia.base.org",
      },
    },
    "optimism-sepolia": {
      url: "https://sepolia.optimism.io",
      accounts,
    },
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASE_API_KEY || "",
      "optimism-sepolia": process.env.ETHERSCAN_API_KEY || "BS56RJPCFREESF68WMCV487FT3VII2QZQT",
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  },
};

export default config;
