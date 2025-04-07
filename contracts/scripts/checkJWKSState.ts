import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Checking JWKS Oracle state with account:", signer.address);

  // Get the deployed JWKSAutomatedOracle contract
  const oracleAddress = "0x7986bA7Feb5EAE2A7Cf4D5d86DD777d6F16b372c";
  const oracle = await ethers.getContractAt("JWKSAutomatedOracle", oracleAddress) as JWKSAutomatedOracle;

  try {
    // Check contract state
    const subscriptionId = await oracle.subscriptionId();
    const donID = await oracle.donID();
    const gasLimit = await oracle.gasLimit();
    const lastTimeStamp = await oracle.lastTimeStamp();
    const interval = await oracle.interval();

    console.log("\nContract State:");
    console.log("Subscription ID:", subscriptionId.toString());
    console.log("DON ID:", donID);
    console.log("Gas Limit:", gasLimit.toString());
    console.log("Last Timestamp:", lastTimeStamp.toString());
    console.log("Interval:", interval.toString());

    // Fetch current JWKS data from Google
    const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
    const jwksData = await response.json();
    console.log("\nGoogle JWKS Keys:", jwksData.keys.map((k: any) => k.kid));

    // Check each key in the contract
    for (const key of jwksData.keys) {
      const modulus = await oracle.kidToModulus(key.kid);
      const expectedModulus = Buffer.from(key.n, "base64").toString("hex");
      const isMatch = modulus.substring(2) === expectedModulus;
      
      console.log(`\nKey ID: ${key.kid}`);
      console.log("Contract Modulus:", modulus);
      console.log("Expected Modulus:", expectedModulus);
      console.log("Match:", isMatch);
    }

  } catch (error) {
    console.error("Error checking JWKS Oracle state:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 