import { ethers } from "hardhat";
import { endpointAddress } from "../../layerZeroConfig";
import { createXAddress } from "../../externalContractAddress";
import { nullBytes32 } from "../../util";

export const main = async () => {
  const salt = nullBytes32;
  const createX = await ethers.getContractAt("CreateX", createXAddress);
  const OmniExecutor = await ethers.getContractFactory("OmniExecutor");
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  const { data } = await OmniExecutor.getDeployTransaction(
    endpointAddress,
    signerAddress
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
