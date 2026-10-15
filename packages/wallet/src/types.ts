import type { EvmErc4337WalletConfig, WalletManagerEvmErc4337 } from '#chains/evm.js'

export type WalletChain = 'evm'
export type { EvmErc4337WalletConfig } from '#chains/evm.js'
export type WalletConfigByChain = { evm: EvmErc4337WalletConfig }
export type WalletManagerForChain<C extends WalletChain> = C extends 'evm' ? WalletManagerEvmErc4337 : never
