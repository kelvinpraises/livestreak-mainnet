import { ARC_MAINNET } from "../network.js";

export const defaultChains = [{
  name: ARC_MAINNET.deployment,
  rpc: ARC_MAINNET.rpcUrl,
  chainId: ARC_MAINNET.chainId,
  currency: ARC_MAINNET.nativeCurrency.symbol,
  explorer: ARC_MAINNET.explorerUrl
}] as const;
