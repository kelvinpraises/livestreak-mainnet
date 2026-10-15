# Bookmaker flow — detect → draft → discovery → decide → execute

End-to-end vault origination inside `@livestreak/bookmaker`. Bookmaker holds the multichain wallet via `chains/` and publishes verified mandate bytes before executing bound vault creation in-package.

## Ideal path

```text
observation events
  → detectOpportunity (pipeline/detection/)
  → buildVaultDraft (pipeline/draft/) — derives seedRate = creatorStake / windowSeconds
  → findSimilar via POST /discovery/find (pipeline/similarity/)
  → chooseVaultAction (pipeline/decision/) — exact vaultKey join + fuzzy policy
  → originateVault (flows/) — guardedCreateVault → runtime.createVaultOnce → chains.writer.createVault(intent)
  → VaultCreated event → vaultId
  → runtime.publishSnapshot + bridge panel projection
```

## Caller injects (never baked)

| Input | Used by |
| --- | --- |
| `walletInit` + `seed` | `createBookmakerChain` → `createWalletManager` |
| `addresses` (`vaultDriver`, `marketRegistry`, `vault`, `usdc`) | EVM reader/writer |
| `readRpcUrl` (optional) | EVM `marketExists` reads |
| `similarityClient` or `createHostDiscoveryClient(baseUrl)` | `findSimilar` |
| `guardedCreateVault` (required; typically `runtime.createVaultOnce`) | `originateVault` at-most-once guard via shared runtime store |
| `fundingToken`, `policy`, `marketContext`, `watchSource` | runtime + draft |
| `nowMs` | all pure stages + bridge authz (no `Date.now()` in `src/`) |
| `nowMs` on bridge methods | capability expiry + `callAction` validation clock |

## Stage edge map

| Stage | Edge | Handled? |
| --- | --- | --- |
| Detection | No detectors / below confidence | Yes — `action: "skip"` |
| Detection | Malformed detector output | Yes — ignored / normalized |
| Draft | `windowSeconds <= 0` | Yes — no `seedRate`; `validateVaultDraftForCreate` fails |
| Draft | Missing stake | Yes — validation fails before execute |
| Similarity | Host 4xx/5xx | Partial — `createHostDiscoveryClient` throws `LiveStreakRuntimeError` |
| Similarity | Empty candidates | Yes — decision policy chooses create/join/skip |
| Similarity | Exact `vaultKey` match on candidate | Yes — `chooseVaultAction` joins |
| Similarity | `duplicateRisk: high` + `skip-on-high` | Yes — skip |
| Decision | Cross-market similarity result | Yes — skip `market_mismatch` |
| Decision | Steward warnings | Yes — skip |
| Execute | Retry / replay / concurrent duplicate create | Yes — `runtime.createVaultOnce` + shared `idempotencyStore` (originate + bridge) |
| Execute | UserOp included but receipt poll times out | Yes — pending `userOpHash` recorded; retry calls `confirmCreateVault` (never blind-resubmit) |
| Execute | Unknown `marketId` on-chain | **UNHANDLED** — reverts at `VaultDriver.createVault` |
| Execute | Insufficient USDC balance | **UNHANDLED** — ERC20 transfer reverts |
| Execute | Insufficient allowance | Partial — writer auto-approves up to deposit |
| Execute | UserOp send / paymaster failure | Partial — classified `LiveStreakRuntimeError`; key released when no hash |
| Execute | Receipt missing `VaultCreated` | Yes — `LiveStreakRuntimeError` |
| Bridge | Missing scope | Yes — `LiveStreakCapabilityError` |
| Bridge | Expired capability grant | Yes — injected `nowMs` vs `grant.expiresAt` |
| Bridge | `createVault` double-submit | Yes — same `createVaultOnce` + store as originate |
| Bridge | Trusted caller | Yes — short-circuit v0 |
| Runtime | Not deployed / wrong addresses | **UNHANDLED** — fails at RPC or revert |

## Idempotency layers

1. **Within-runtime (deterministic):** `idempotencyKeyFromDraft` / `idempotencyKeyFromCreateIntent` hash vault-defining fields. `BookmakerRuntime.createVaultOnce` validates intent, computes key, and enforces at-most-one submit per key: settled → cached; pending `userOpHash` → `confirmCreateVault` (never blind-resubmit); new → `createVault`. Receipt-timeout records the hash as pending. Originate passes `guardedCreateVault: runtime.createVaultOnce`; bridge `callAction("createVault")` calls the same method.
2. **Across runtime restarts:** all three writers look up the caller-supplied operation in authoritative chain state before publication/submission. Identical terms return the original vault, including after the funding deadline; conflicting terms reject. The contract also enforces that identity atomically. Different operations can intentionally create different vaults; similarity discovery does not make distinct operations unique.

## Arc execution layout

```text
chains/     inward door — wallet + vaultDriver writes
flows/      orchestration — originateVault
runtime/    floating-gate state + idempotency store + subscriptions
bridge/     outward door — panel + scoped callAction
```

## Contract truth

Creation requires caller-authored `livestreak-mandate/1` terms, a nonzero 32-byte operation ID, and `hostUrl`. The writer verifies the actual RPC chain identity, publishes the canonical bytes and checks their digest before signing. Creation stores the immutable commitment and funding deadline with the seed. Failed publication/readback sends no creation transaction.

- EVM: `VaultDriver.createBoundVault`; `VaultCreated` identifies the vault.

Independent Options/Steward readers bind the exact body to chain, market, question, commitment and deadline. New funding/top-ups require a verified, open mandate; removal/refund paths remain available without Host content. SDK checks use chain time, and actual streaming/accounting stops at each vault's deadline.


## Errors

Configuration, capability, transaction and mandate-validation failures propagate to the caller. Missing terms are never replaced by inferred settlement defaults.

## Verification

Unit tests cover mandate publication, EVM encoding and idempotent creation.
The canonical Arc contracts are deployed. An authorized real-collateral market
lifecycle through a configured mainnet Host and bundler remains to be verified.
