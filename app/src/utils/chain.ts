import { isAddress } from "viem";
import { ARC_MAINNET } from "@livestreak/contracts/evm";

export type OptionsChainKind = "evm";
export const EVM_NETWORK = {
  chainId: ARC_MAINNET.chainId,
  name: ARC_MAINNET.name,
  rpcUrl: ARC_MAINNET.rpcUrl,
  token: {
    symbol: ARC_MAINNET.collateral.symbol,
    decimals: ARC_MAINNET.collateral.decimals,
  },
} as const;
export const SESSION_CHAIN_KEY = "livestreak_mainnet_options_chain";
export interface ChainOption {
  readonly id: OptionsChainKind;
  readonly label: string;
  readonly network: string;
}
export const SUPPORTED_CHAINS: readonly ChainOption[] = [
  { id: "evm", label: "Arc", network: "Mainnet · 5042" },
];
export function firstOtherChainWithVaults(
  _active: OptionsChainKind,
  _hasVaults: (chain: OptionsChainKind) => boolean,
): OptionsChainKind | null {
  void _active;
  void _hasVaults;
  return null;
}
export const chainLabel = (_id: OptionsChainKind): string => {
  void _id;
  return "Arc";
};
export function readStoredChain(): OptionsChainKind | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_CHAIN_KEY) === "evm" ? "evm" : null;
}
export function recipientPlaceholder(_chain: OptionsChainKind): string {
  void _chain;
  return "Transfer to 0x…";
}
export function isValidRecipientAddress(_chain: OptionsChainKind, value: string): boolean {
  return isAddress(value);
}
