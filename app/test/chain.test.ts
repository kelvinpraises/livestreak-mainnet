import { describe, expect, it, beforeEach } from 'vitest'
import {
  SESSION_CHAIN_KEY,
  SUPPORTED_CHAINS,
  firstOtherChainWithVaults,
  isValidRecipientAddress,
  readStoredChain,
  recipientPlaceholder,
} from '../src/utils/chain'

// readStoredChain guards on `typeof window` and reads sessionStorage; the default vitest env is
// node, so install a minimal in-memory shim rather than pulling in a full DOM environment.
function installSessionStorage(): void {
  const store = new Map<string, string>()
  const shim = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  }
  ;(globalThis as Record<string, unknown>).window = globalThis
  ;(globalThis as Record<string, unknown>).sessionStorage = shim
}

describe('Arc mainnet selection', () => {
  beforeEach(installSessionStorage)
  it('restores only the mainnet EVM session', () => {
    sessionStorage.setItem(SESSION_CHAIN_KEY, 'evm')
    expect(readStoredChain()).toBe('evm')
    sessionStorage.setItem(SESSION_CHAIN_KEY, 'unsupported')
    expect(readStoredChain()).toBeNull()
    sessionStorage.clear()
    expect(readStoredChain()).toBeNull()
  })
  it('advertises only Arc mainnet', () => {
    expect(SUPPORTED_CHAINS).toEqual([{ id: 'evm', label: 'Arc', network: 'Mainnet · 5042' }])
    expect(firstOtherChainWithVaults('evm', () => true)).toBeNull()
  })
  it('accepts only EVM recipients', () => {
    expect(recipientPlaceholder('evm')).toBe('Transfer to 0x…')
    expect(isValidRecipientAddress('evm', '0x000000000000000000000000000000000000dEaD')).toBe(true)
    for (const value of ['', 'short', '0x1234', 'not-an-address']) {
      expect(isValidRecipientAddress('evm', value)).toBe(false)
    }
  })
})
