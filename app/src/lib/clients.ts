import { createPublicClient, createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";

export const baseSepoliaPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export const baseSepoliaWalletClient = createWalletClient({
  chain: baseSepolia,
  transport: http(),
});
