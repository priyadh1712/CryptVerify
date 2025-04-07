import { ethers } from "hardhat";
import * as dotenv from "dotenv";

async function main() {
  const privateKey = process.env.PRIVATE_KEY || "";
  const wallet = new ethers.Wallet(privateKey);
  console.log("Address:", wallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 