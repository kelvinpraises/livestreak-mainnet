# Arc wallet architecture

`create-wallet-manager.ts` accepts the EVM wallet kind and delegates to `chains/evm.ts`.
That seam owns the vendored ERC-4337 Safe account implementation under `vendor/evm/`.
The public facade exports the wallet manager, account types, and receipt polling.
Keystore encryption and password derivation live in the wallet package; the CLI selects
its dedicated mainnet keystore path.

The Host proxies an explicitly configured bundler and optional paymaster. It does not
run either service. Arc sponsorship requires a provider policy and verification;
configuration alone is not evidence that gas is sponsored.
