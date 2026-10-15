# LiveStreak wallet

EVM ERC-4337 Safe accounts and Node-only gateway keystores for the Arc edition.

Import `createWalletManager` and the EVM account classes from `@livestreak/wallet`.
Import the at-rest gateway keystore from `@livestreak/wallet/keystore` on Node only.
Signing stays with the operator. The Host proxies configured bundler/paymaster endpoints.

Production uses Arc mainnet, chain ID 5042. Native gas uses 18-decimal USDC;
the USDC ERC-20 interface uses six decimals over the same balance. Wallet
configuration and sponsorship must be verified against Arc before release.

```sh
npm run build --workspace=@livestreak/wallet
npm run check --workspace=@livestreak/wallet
npm run test --workspace=@livestreak/wallet
```
