import type { Address } from 'viem'
import { useOptionsContext } from '#/providers/options-provider'
import type { OptionsChainKind } from '#/utils/chain'
export interface WalletActions {
  readonly address: Address | null
  readonly chain: OptionsChainKind
  readonly usdcBalance: number
  readonly isConnected: boolean
}
export function useWalletActions(): WalletActions {
  const { address, chain, usdcBalance, isConnected } = useOptionsContext()
  return { address, chain, usdcBalance, isConnected }
}
