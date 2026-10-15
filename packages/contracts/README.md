# LiveStreak contracts

Solidity contracts and typed bindings for Arc mainnet (chain 5042).

The canonical deployment is `chains/evm/deployments/arc-mainnet.json`.
`arc-mainnet-verification.json` records receipts, gas costs, and wiring checks.
Market collateral is real USDC at `0x3600000000000000000000000000000000000000`.
ERC-20 amounts use six decimals; native gas uses eighteen decimals against the same balance.

```ts
import { arcMainnetDeployment, contract } from '@livestreak/contracts/evm';
const vault = contract('vault');
```

`chains/evm/` contains source, Foundry unit tests, deployment scripts, ABIs, and snapshots.
`kit/` exports the EVM package. Browser consumers use the EVM entry point; disk loaders
are isolated under `@livestreak/contracts/evm/node`.

Run `npm test --workspace=packages/contracts` for Solidity unit tests and
`npm run build:ts --workspace=packages/contracts` for bindings.
The deployed contracts are verified; a real-money market lifecycle is not yet verified.
