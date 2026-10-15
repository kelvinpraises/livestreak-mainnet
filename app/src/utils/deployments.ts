import { isAddress } from 'viem'
import { arcMainnetDeployment } from '@livestreak/contracts/evm'
import type { OptionsContractAddresses } from '@livestreak/options'

import { EVM_NETWORK, readStoredChain, type OptionsChainKind } from './chain'

// Deployment addresses and ABIs come from the same contracts package.
const configuredDeployment = arcMainnetDeployment
if (configuredDeployment.chainId !== EVM_NETWORK.chainId) throw new Error(`Expected ${EVM_NETWORK.name} deployment (${EVM_NETWORK.chainId})`)

export const EVM_RPC_URL = EVM_NETWORK.rpcUrl
export const EVM_AA_CONTRACTS = configuredDeployment?.scopes.aa?.contracts ?? {}

export function buildOptionsContractAddresses(): OptionsContractAddresses {
  if (!configuredDeployment) throw new Error(`${EVM_NETWORK.name} deployment is not configured`)
  const protocol = configuredDeployment.scopes.protocol?.contracts ?? {}
  const wire = configuredDeployment.scopes.wire?.contracts ?? {}
  const streaming = configuredDeployment.scopes.streaming?.contracts ?? {}

  return {
    marketRegistry: protocol.marketRegistry as `0x${string}`,
    vault: protocol.vault as `0x${string}`,
    marketDriver: wire.marketDriverProxy as `0x${string}`,
    stewardRegistry: protocol.stewardRegistry as `0x${string}`,
    treasury: protocol.treasury as `0x${string}`,
    lvstToken: protocol.lvstToken as `0x${string}`,
    dripsStreaming: streaming.dripsProxy as `0x${string}`,
  }
}

export function isChainDeployed(chain: OptionsChainKind): boolean {
  if (chain !== 'evm') return false
  try { return Object.values(buildOptionsContractAddresses()).every(value => isAddress(value) && !/^0x0+$/.test(value)) }
  catch { return false }
}
export const deployedChains = (): OptionsChainKind[] => isChainDeployed('evm') ? ['evm'] : []
export function defaultChain(): OptionsChainKind { return 'evm' }
export function initialChain(_enabled: boolean): OptionsChainKind { void _enabled; return readStoredChain() ?? 'evm' }
