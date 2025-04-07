"use client";

import { GoogleLogin } from "@react-oauth/google";
import { Copy, Loader2, Wallet } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Hex, encodeFunctionData, formatEther, fromHex, toHex } from "viem";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { baseSepoliaPublicClient } from "@/lib/clients";
import { sampleJWT } from "@/lib/jwt";
import { request } from "@/lib/rpc";
import { truncate } from "@/lib/utils";

import { AuthWalletAbi } from "../../../contracts/abis/AuthWallet";
import { AuthWalletFactoryAbi } from "../../../contracts/abis/AuthWalletFactory";
import { EntryPointAbi } from "../../../contracts/abis/EntryPoint";
import { deployedContractAddress } from "../../../contracts/deployedContractAddress";
import { entryPointAddress } from "../../../contracts/externalContractAddress";

export const SendTransaction = () => {
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("");
  const [userOp, setUserOp] = useState<any>();
  const [userOpHash, setUserOpHash] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [idToken, setIdToken] = useState("");

  useEffect(() => {
    if (window.opener && window.opener.parent) {
      const email = window.localStorage.getItem("email");
      const address = window.localStorage.getItem("address");
      if (!email || !address) {
        return;
      }
      const aud = process.env.NEXT_PUBLIC_CLIENT_ID || "";
      const handleTransactionMessage = async (event: MessageEvent) => {
        if (event.data.type == "sendTransaction") {
          const { from, to, value, data } = event.data;

          if (from !== address) {
            throw new Error("Invalid from address");
          }

          setTo(to);
          setValue(value);
          setData(data);

          const nonce = await baseSepoliaPublicClient.readContract({
            abi: EntryPointAbi,
            address: entryPointAddress,
            functionName: "getNonce",
            args: [from, BigInt(0)],
          });
          console.log("nonce", nonce);
          let initCode = "0x";
          const code = await baseSepoliaPublicClient.getCode({ address: from });
          if (!code || code === "0x") {
            const initCallData = encodeFunctionData({
              abi: AuthWalletFactoryAbi,
              functionName: "createAccount",
              args: [aud, email, BigInt(0)],
            });
            const factoryAddressBytes =
              deployedContractAddress.AuthWalletFactory.toLowerCase().replace(
                "0x",
                "",
              );
            initCode = `0x${factoryAddressBytes}${initCallData.slice(2)}`;
          }
          console.log("initCode", initCode);
          const callData = encodeFunctionData({
            abi: AuthWalletAbi,
            functionName: "execute",
            args: [to, value ? value : BigInt(0), data ? data : "0x"],
          });
          console.log("callData", callData);

          const userOp = {
            sender: address,
            nonce: toHex(nonce),
            initCode,
            callData,
            maxFeePerGas: "0x0",
            maxPriorityFeePerGas: "0x0",
            paymasterAndData: "0x",
            signature: toHex(sampleJWT),
          } as any;

          console.log("userOp", userOp);

          const latestBlock = await baseSepoliaPublicClient.getBlock();
          console.log("latestBlock", latestBlock);
          const baseFeePerGas = latestBlock.baseFeePerGas || BigInt(0);
          console.log("baseFeePerGas", baseFeePerGas);
          const adjustedBaseFeePerGas =
            baseFeePerGas + baseFeePerGas / BigInt(4);

          const { result: maxPriorityFeePerGasHex } = await request(
            "rundler_maxPriorityFeePerGas",
            [],
          );
          const maxPriorityFeePerGas = BigInt(maxPriorityFeePerGasHex);
          console.log("maxPriorityFeePerGas", maxPriorityFeePerGas);
          const adjustedMaxPriorityFeePerGas =
            maxPriorityFeePerGas + maxPriorityFeePerGas / BigInt(4);
          console.log(
            "adjustedMaxPriorityFeePerGas",
            adjustedMaxPriorityFeePerGas,
          );
          const maxFeePerGas =
            adjustedBaseFeePerGas + BigInt(adjustedMaxPriorityFeePerGas);
          console.log("maxFeePerGas", maxFeePerGas);

          userOp.maxFeePerGas = toHex(maxFeePerGas);
          userOp.maxPriorityFeePerGas = toHex(adjustedMaxPriorityFeePerGas);

          const estimateUserOperationGasRes = await request(
            "eth_estimateUserOperationGas",
            [userOp, entryPointAddress],
          );

          console.log(
            "estimateUserOperationGasRes",
            estimateUserOperationGasRes,
          );
          if (estimateUserOperationGasRes.error) {
            throw new Error(estimateUserOperationGasRes.error.message);
          }

          const { callGasLimit, preVerificationGas, verificationGasLimit } =
            estimateUserOperationGasRes.result;
          console.log("callGasLimit", callGasLimit);
          console.log("preVerificationGas", preVerificationGas);
          console.log("verificationGasLimit", verificationGasLimit);
          userOp.callGasLimit = callGasLimit;
          userOp.preVerificationGas = preVerificationGas;
          userOp.verificationGasLimit = verificationGasLimit;

          console.log("userOp", userOp);

          const userOpHash = await baseSepoliaPublicClient.readContract({
            abi: EntryPointAbi,
            address: entryPointAddress,
            functionName: "getUserOpHash",
            args: [userOp],
          });
          console.log("userOpHash", userOpHash);
          setUserOp(userOp);
          setUserOpHash(userOpHash);
        }
      };
      window.addEventListener("message", handleTransactionMessage);
      window.opener.parent.postMessage({ type: "ready" }, "*");
      return () => {
        window.removeEventListener("message", handleTransactionMessage);
      };
    }
  }, []);

  const handleClose = () => {
    if (window.opener && window.opener.parent) {
      window.opener.parent.postMessage(
        { type: "transactionHash", transactionHash },
        "*",
      );
    }
    window.close();
  };

  const handleCopyIdToken = () => {
    navigator.clipboard.writeText(idToken).then(() => {
      alert("ID Token copied to clipboard!");
    });
  };

  const TransactionPreview = () => (
    <div className="mb-4 text-left space-y-2">
      <div className="flex flex-col">
        <span className="font-semibold text-sm">Executed At:</span>
        <span className="text-sm break-all">Base Sepolia</span>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">To:</span>
        <span className="text-sm break-all">{to}</span>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">Value:</span>
        <span className="text-sm break-all">
          {value ? formatEther(fromHex(value as Hex, "bigint")) : "0"} ETH
        </span>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-sm">Data:</span>
        <span className="text-sm break-all">{truncate(data, 60)}</span>
      </div>
      {userOpHash && (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">UserOpHash:</span>
          <span className="text-sm break-all">
            <a
              href={`https://jiffyscan.xyz/userOpHash/${userOpHash}?network=base-sepolia`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {userOpHash}
            </a>
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-[400px] h-[600px] bg-gradient-to-br from-blue-100 to-indigo-200 p-4 flex flex-col">
      <header className="bg-white/90 backdrop-blur-sm shadow-md rounded-2xl mb-8">
        <div className="px-6 py-4 flex justify-center items-center">
          <Wallet className="text-indigo-600 mr-2" size={24} />
          <h1 className="text-2xl font-bold text-indigo-600">AuthWallet 2.5</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center items-center p-4">
        <Card className="w-full max-w-sm bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl text-indigo-700">
              {transactionHash ? "Transaction Confirmed" : "Send Transaction"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionPreview />
            {!userOp && !transactionHash && (
              <>
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <span className="ml-2">Preparing transaction...</span>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center">
                    Waiting for transaction details...
                  </p>
                )}
              </>
            )}
            {userOp && userOpHash && !transactionHash && (
              <>
                <p className="mb-4 text-gray-600 text-center">
                  Please approve the transaction by signing in with Google
                </p>
                <div className="flex justify-center">
                  <GoogleLogin
                    nonce={userOpHash}
                    onSuccess={async ({ credential }) => {
                      if (!credential) {
                        throw new Error("No credential");
                      }
                      setIdToken(credential);
                      setIsLoading(true);
                      userOp.signature = toHex(credential);
                      const ethSendUserOperationRes = await fetch("/bundler", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: 1,
                          jsonrpc: "2.0",
                          method: "eth_sendUserOperation",
                          params: [userOp, entryPointAddress],
                        }),
                      }).then((res) => res.json());
                      console.log(
                        "ethSendUserOperationRes",
                        ethSendUserOperationRes,
                      );
                      const requestId = ethSendUserOperationRes.result;

                      const pollReceipt = async (
                        requestId: string,
                      ): Promise<any> => {
                        return new Promise((resolve, reject) => {
                          const interval = setInterval(async () => {
                            console.log("pollReceipt... ", requestId);
                            const userOperationReceipt = await request(
                              "eth_getUserOperationReceipt",
                              [requestId],
                            );
                            if (userOperationReceipt.error) {
                              clearInterval(interval);
                              reject(userOperationReceipt.error.message);
                            }
                            if (userOperationReceipt.result) {
                              clearInterval(interval);
                              resolve(userOperationReceipt.result.receipt);
                            }
                          }, 2000);
                        });
                      };
                      const userOperationReceipt = await pollReceipt(requestId);
                      console.log("userOperationReceipt", userOperationReceipt);

                      const transactionHash =
                        userOperationReceipt.transactionHash;
                      console.log("transactionHash", transactionHash);
                      setTransactionHash(transactionHash);
                      setIsLoading(false);
                    }}
                  />
                </div>
                {isLoading && (
                  <div className="mt-4 flex justify-center items-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Processing transaction...</span>
                  </div>
                )}
              </>
            )}
            {transactionHash && (
              <>
                {idToken && (
                  <div className="mb-4 flex justify-center">
                    <Button
                      onClick={handleCopyIdToken}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center"
                    >
                      <Copy className="mr-2" size={16} />
                      Copy ID Token
                    </Button>
                  </div>
                )}
                <div className="mb-4 flex flex-col">
                  <span className="font-semibold text-sm">
                    Transaction Hash:
                  </span>
                  <span className="text-sm break-all">
                    <a
                      href={`https://sepolia.basescan.org//tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {transactionHash}
                    </a>
                  </span>
                </div>
                <Button
                  onClick={handleClose}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                >
                  Close
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
