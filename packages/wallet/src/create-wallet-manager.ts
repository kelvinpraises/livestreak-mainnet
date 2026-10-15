import { ConfigurationError, WalletManagerEvmErc4337 } from '#chains/evm.js'
import type { WalletChain, WalletConfigByChain, WalletManagerForChain } from '#types.js'

export function createWalletManager<C extends WalletChain>(
  chain: C,
  seed: string | Uint8Array,
  config: WalletConfigByChain[C],
): WalletManagerForChain<C> {
  if (chain !== 'evm') throw new ConfigurationError(`Unsupported wallet chain: ${String(chain)}`)
  return new WalletManagerEvmErc4337(seed, config) as WalletManagerForChain<C>
}

export default createWalletManager
