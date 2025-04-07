import { ethers } from "hardhat";
import { deployedContractAddress } from "../deployedContractAddress";
import { entryPointAddress } from "../externalContractAddress";
import { endpointAddress } from "../layerZeroConfig";

async function main() {
  console.log("Deploying contracts...");

  // Use the specified account
  const deployer = new ethers.Wallet(
    process.env.PRIVATE_KEY || "",
    ethers.provider
  );
  const ownerAddress = deployer.address;
  console.log("Deploying contracts with account:", ownerAddress);

  // Deploy JWKSAutomatedOracle first
  console.log("\n1. Deploying JWKSAutomatedOracle...");
  
  // Optimized constructor arguments for JWKSAutomatedOracle
  const router = "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C"; // Base Sepolia Functions Router
  const donID = "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000"; // Base Sepolia DON ID
  const subscriptionId = "301"; // Base Sepolia subscription ID
  const gasLimit = 200000; // Reduced gas limit

  console.log("Deploying JWKSAutomatedOracle with parameters:");
  console.log("Router:", router);
  console.log("DON ID:", donID);
  console.log("Subscription ID:", subscriptionId);
  console.log("Gas Limit:", gasLimit);

  const JWKSAutomatedOracle = await ethers.getContractFactory("JWKSAutomatedOracle");
  const jwksOracle = await JWKSAutomatedOracle.deploy(
    router,
    donID,
    subscriptionId,
    gasLimit
  );
  await jwksOracle.waitForDeployment();
  const jwksOracleAddress = await jwksOracle.getAddress();
  console.log("JWKSAutomatedOracle deployed to:", jwksOracleAddress);

  // Deploy OmniExecutor
  console.log("\n2. Deploying OmniExecutor...");
  const OmniExecutor = await ethers.getContractFactory("OmniExecutor", deployer);
  
  const omniExecutor = await OmniExecutor.deploy(
    endpointAddress, // LayerZero endpoint from config
    ownerAddress // Owner address
  );
  await omniExecutor.waitForDeployment();
  const omniExecutorAddress = await omniExecutor.getAddress();
  console.log("OmniExecutor deployed to:", omniExecutorAddress);

  // Deploy AuthWalletFactory
  console.log("\n3. Deploying AuthWalletFactory...");
  const AuthWalletFactory = await ethers.getContractFactory("AuthWalletFactory", deployer);
  
  const authWalletFactory = await AuthWalletFactory.deploy(
    entryPointAddress, // EntryPoint address from config
    jwksOracleAddress, // JWKSAutomatedOracle address
    omniExecutorAddress // OmniExecutor address
  );
  await authWalletFactory.waitForDeployment();
  const authWalletFactoryAddress = await authWalletFactory.getAddress();
  console.log("AuthWalletFactory deployed to:", authWalletFactoryAddress);

  // Update deployedContractAddress.ts
  console.log("\nUpdating deployedContractAddress.ts...");
  const fs = require("fs");
  const path = require("path");
  const deployedContractAddressPath = path.join(__dirname, "../deployedContractAddress.ts");
  const deployedContractAddressContent = `export const deployedContractAddress = {
  OmniExecutor: "${omniExecutorAddress}" as const,
  JWKSAutomatedOracle: "${jwksOracleAddress}" as const,
  AuthWalletFactory: "${authWalletFactoryAddress}" as const,
};`;
  fs.writeFileSync(deployedContractAddressPath, deployedContractAddressContent);
  console.log("deployedContractAddress.ts updated!");

  console.log("\nDeployment completed!");
  console.log("JWKSAutomatedOracle:", jwksOracleAddress);
  console.log("OmniExecutor:", omniExecutorAddress);
  console.log("AuthWalletFactory:", authWalletFactoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});