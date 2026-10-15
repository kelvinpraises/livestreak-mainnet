import type { IWalletAccount } from '@tetherto/wdk-wallet'
import type { WalletAccountEvmErc4337 } from '#chains/evm.js'
type Satisfies<Iface, T extends Iface> = T
type EvmSatisfiesIWalletAccount = Satisfies<IWalletAccount, WalletAccountEvmErc4337>
export type { EvmSatisfiesIWalletAccount }
