import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);

  // Get the deployed JWKSAutomatedOracle contract
  const oracleAddress = "0x7986bA7Feb5EAE2A7Cf4D5d86DD777d6F16b372c";
  const oracle = await ethers.getContractAt("JWKSAutomatedOracle", oracleAddress) as JWKSAutomatedOracle;

  // Check contract state
  console.log("Checking contract state...");
  const subscriptionId = await oracle.subscriptionId();
  const donID = await oracle.donID();
  const gasLimit = await oracle.gasLimit();
  const lastTimeStamp = await oracle.lastTimeStamp();
  const interval = await oracle.interval();

  console.log("Contract State:");
  console.log("Subscription ID:", subscriptionId.toString());
  console.log("DON ID:", donID);
  console.log("Gas Limit:", gasLimit.toString());
  console.log("Last Timestamp:", lastTimeStamp.toString());
  console.log("Interval:", interval.toString());

  console.log("Making request to fetch JWKS data...");
  
  try {
    // First, try to estimate gas
    console.log("Estimating gas...");
    const gasEstimate = await oracle.triggerJWKSFetch.estimateGas();
    console.log("Gas estimate:", gasEstimate.toString());

    // Then try to send the transaction with higher gas limit
    const tx = await oracle.triggerJWKSFetch({
      gasLimit: gasEstimate * 2n // Use double the estimated gas
    });
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error("Transaction receipt is null");
    }
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Wait for the Chainlink Functions callback
    console.log("Waiting for Chainlink Functions callback...");
    
    // Listen for the ModulusReceived event
    oracle.on("ModulusReceived", (kid: string, modulus: string) => {
      console.log("JWKS Data Updated!");
      console.log("Key ID:", kid);
      console.log("Modulus:", modulus);
      process.exit(0);
    });

    // Set a timeout in case something goes wrong
    setTimeout(() => {
      console.log("Timeout waiting for callback");
      process.exit(1);
    }, 300000); // 5 minutes timeout

  } catch (error: any) {
    console.error("Error testing JWKS Oracle:");
    if (error.data) {
      console.error("Error data:", error.data);
    }
    if (error.reason) {
      console.error("Error reason:", error.reason);
    }
    if (error.code) {
      console.error("Error code:", error.code);
    }
    console.error("Full error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 