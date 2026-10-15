# Browser-safe Arc exports

| Import | Purpose |
| --- | --- |
| `@livestreak/contracts/evm` | `arcMainnetDeployment`, `addresses`, `contract()`, ABIs |
| `@livestreak/contracts/evm/abis` | ABI-only imports |
| `@livestreak/contracts/evm/deployments/arc-mainnet` | Typed deployment snapshot |
| `@livestreak/contracts/evm/node` | Node-only JSON loaders |

`contract()` and disk loaders default to `arc-mainnet`. The frontend imports the
canonical snapshot rather than copying deployment addresses into environment JSON.
