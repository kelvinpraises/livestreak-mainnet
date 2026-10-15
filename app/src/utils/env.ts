import { EVM_NETWORK } from './chain'

/** Client env — single place for Vite `import.meta.env` reads. */

export const env = {
  hostBaseUrl:
    (import.meta.env.VITE_HOST_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8788',
  activityWsUrl: (import.meta.env.VITE_ACTIVITY_WS_URL as string | undefined)?.trim(),
  optionsOn: (import.meta.env.VITE_OPTIONS_MODE as string | undefined) !== 'off',
  evmChainId: EVM_NETWORK.chainId,
} as const

// import.meta.env.DEV is a Vite BUILD-TIME boolean (not runtime config), so it is read directly at
// its use sites (e.g. use-wallet-actions.ts) rather than routed through this module.

export const HOST_BASE_URL = env.hostBaseUrl
export const EVM_CHAIN_ID = env.evmChainId

export function isOptionsModeEnabled(): boolean {
  return env.optionsOn
}
