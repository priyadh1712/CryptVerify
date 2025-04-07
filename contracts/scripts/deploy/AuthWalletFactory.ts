import { ethers } from "hardhat";

import {
  createXAddress,
  entryPointAddress,
} from "../../externalContractAddress";
import { deployedContractAddress } from "../../deployedContractAddress";
import { nullBytes32 } from "../../util";

export const main = async () => {
  const salt = nullBytes32;
  const createX = await ethers.getContractAt("CreateX", createXAddress);
  const AuthWalletFactory = await ethers.getContractFactory(
    "AuthWalletFactory"
  );
  const { data } = await AuthWalletFactory.getDeployTransaction(
    entryPointAddress,
    deployedContractAddress.JWKSAutomatedOracle,
    deployedContractAddress.OmniExecutor
  );
  const saltHash = ethers.keccak256(salt);
  const initCodeHash = ethers.keccak256(data);
  const computedAddress = await createX[
    "computeCreate2Address(bytes32,bytes32)"
  ](saltHash, initCodeHash);
  console.log("computedAddress:", computedAddress);
  await createX["deployCreate2(bytes32,bytes)"](nullBytes32, data).catch(() =>
    console.log("already deployed")
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
