import type { Address } from "viem";

/** Arc is the only public deployment target of this edition. */
export const ARC_MAINNET = {
  name: "Arc",
  deployment: "arc-mainnet",
  chainId: 5042,
  rpcUrl: "https://rpc.mainnet.arc.io",
  explorerUrl: "https://explorer.arc.io",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  collateral: {
    address: "0x3600000000000000000000000000000000000000" as Address,
    symbol: "USDC",
    decimals: 6
  }
} as const;
