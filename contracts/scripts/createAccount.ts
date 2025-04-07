import { ethers } from "hardhat";

import { deployedContractAddress } from "../deployedContractAddress";

export const main = async () => {
  const authWalletFactory = await ethers.getContractAt(
    "AuthWalletFactory",
    deployedContractAddress.AuthWalletFactory
  );
  const tx = await authWalletFactory.createAccount(
    "831675566819-pnmr5spfvvnb98v44n6tf6nhn4feslb5.apps.googleusercontent.com",
    "taijusanagi@gmail.com", // replace this email with your own
    0
  );
  await tx.wait();
  console.log("Create account performed", tx.hash);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
