import { NextResponse } from "next/server";
import { Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  baseSepoliaPublicClient,
  baseSepoliaWalletClient,
} from "@/lib/clients";

import { EntryPointAbi } from "../../../../contracts/abis/EntryPoint";
import { entryPointAddress } from "../../../../contracts/externalContractAddress";
import { defaultSignerPrivateKey } from "../../../../contracts/key";

export async function POST(request: Request) {
  try {
    const jsonRpcRequest = await request.json();

    if (jsonRpcRequest.method !== "eth_sendUserOperation") {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 });
    }

    const [userOp, entryPointAddr] = jsonRpcRequest.params;

    if (entryPointAddr.toLowerCase() !== entryPointAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid EntryPoint address" },
        { status: 400 },
      );
    }

    const account = privateKeyToAccount(
      (process.env.PRIVATE_KEY as Hex) || defaultSignerPrivateKey,
    );

    const txHash = await baseSepoliaWalletClient.writeContract({
      abi: EntryPointAbi,
      address: entryPointAddress,
      functionName: "handleOps",
      args: [[userOp], account.address],
      account,
    });
    console.log("txHash", txHash);

    const userOpHash = await baseSepoliaPublicClient.readContract({
      abi: EntryPointAbi,
      address: entryPointAddress,
      functionName: "getUserOpHash",
      args: [userOp],
    });

    return NextResponse.json({
      id: jsonRpcRequest.id,
      jsonrpc: jsonRpcRequest.jsonrpc,
      result: userOpHash,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process bundling" },
      { status: 500 },
    );
  }
}
