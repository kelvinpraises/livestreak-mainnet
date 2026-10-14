# LiveStreak mainnet repository

## Scope

- Repository: `kelvinpraises/livestreak-mainnet`; integration branch: `main`.
- Production target: Arc mainnet, chain ID 5042, real USDC.
- This checkout is independent from `../flowstream`, the Monad testnet edition.
- Make Arc changes here. Do not edit or publish the Monad repository as part of this work.
- Arc testnet may be used for verification; it is not a second production target.

## Current state

The repository starts from the corrected Monad commit `633564e`. Arc integration
and mainnet deployment have not been completed. Existing Monad, Arbitrum,
Solana and Sui artifacts are inherited code, not deployments of this edition.
Keep README.md and DEPLOYMENT.md honest about what is actually configured,
deployed and verified. Never invent deployment addresses or successful runs.

## Asset and environment boundaries

- Native Arc gas amounts use 18 decimals. USDC ERC-20 amounts use 6 decimals.
- Both views refer to the same balance; never add them as separate assets.
- Use Arc's USDC ERC-20 interface for market collateral. Do not deploy MockUSDC
  or expose permissionless test-token minting in the mainnet application.
- Review native transfers, gas reserves, sponsorship and balance sweeps for
  their effect on real USDC. Filter transfer logs by emitter to avoid duplicates.
- Never copy private `.env`, operator wallets, deployment keys or populated
  databases from the Monad edition. Use dedicated database and media storage.
- Keep build outputs, node_modules, recordings and secrets out of Git.

## Publishing

Do not release inherited Monad defaults as an Arc application. Public deployment
workflows remain disabled until the Arc migration and lifecycle verification are
complete and the repository variable ARC_MAINNET_READY is explicitly set to true.
Use only this repository's container names, hosts and deployment credentials.
