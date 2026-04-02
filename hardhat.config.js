import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

export default {
  solidity: {
    version: "0.8.20", // Matches your contract
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Better for complex flash loan logic
      },
    },
  },
  networks: {
    polygon: {
      url: process.env.POLYGON_HTTP || "https://polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};