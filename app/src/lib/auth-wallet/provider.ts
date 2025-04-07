import { Address, EIP1193EventMap, EIP1193Provider, Hex } from "viem";

import { chainId } from "./constant";
import { handlePopup } from "./popup";

export class AuthWalletProvider implements EIP1193Provider {
  address?: Address;

  on<event extends keyof EIP1193EventMap>(
    event: event,
    listener: EIP1193EventMap[event],
  ): void {
    console.log("on", event, listener);
    throw new Error(`on is not implemented`);
  }

  removeListener<event extends keyof EIP1193EventMap>(
    event: event,
    listener: EIP1193EventMap[event],
  ): void {
    console.log("removeListener", event, listener);
    throw new Error(`removeListener is not implemented`);
  }

  async init() {
    const _address = await handlePopup("connect", "address");
    this.address = _address as Address;
  }

  async request(args: { method: string; params?: unknown }): Promise<any> {
    switch (args.method) {
      case "eth_chainId":
        return chainId;
      case "eth_accounts":
        return this.address ? [this.address] : [];
      case "eth_sendTransaction":
        const [transaction] = args.params as Array<{
          from: Address;
          to: Address;
          value: Hex;
          data?: Hex;
        }>;
        return handlePopup("sendTransaction", "transactionHash", transaction);
      default:
        throw new Error(
          `Request rethod:${args.method} not implemented in CustomProvider`,
        );
    }
  }
}
