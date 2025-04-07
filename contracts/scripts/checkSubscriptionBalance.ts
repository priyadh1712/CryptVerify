import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Checking subscription balance with account:", signer.address);

  // Get the deployed JWKSAutomatedOracle contract
  const oracleAddress = "0x7986bA7Feb5EAE2A7Cf4D5d86DD777d6F16b372c";
  const oracle = await ethers.getContractAt("JWKSAutomatedOracle", oracleAddress) as JWKSAutomatedOracle;

  try {
    // Get the Functions Router address
    const routerAddress = "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C";
    const router = await ethers.getContractAt("IFunctionsRouter", routerAddress);

    // Get the subscription ID
    const subscriptionId = await oracle.subscriptionId();
    console.log("\nSubscription ID:", subscriptionId.toString());

    // Check if contract is a consumer
    const isConsumer = await router.isConsumer(oracleAddress, subscriptionId);
    console.log("Is contract a consumer:", isConsumer);

    // Get LINK token address
    const linkTokenAddress = "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196"; // Base Sepolia LINK
    const linkToken = await ethers.getContractAt("IERC20", linkTokenAddress);

    // Check subscription balance
    const balance = await linkToken.balanceOf(routerAddress);
    console.log("Router LINK balance:", ethers.formatEther(balance), "LINK");

    // Check if we can read the subscription details
    try {
      const subscription = await router.getSubscription(subscriptionId);
      console.log("\nSubscription Details:");
      console.log("Owner:", subscription.owner);
      console.log("Balance:", ethers.formatEther(subscription.balance), "LINK");
      console.log("Blocked balance:", ethers.formatEther(subscription.blockedBalance), "LINK");
    } catch (error) {
      console.error("Error reading subscription details:", error);
    }

  } catch (error) {
    console.error("Error checking subscription balance:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 