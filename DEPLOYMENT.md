# Arc mainnet deployment

`main` in this repository is dedicated to **Arc mainnet (5042)**. This checkout is independent from the earlier testnet edition.

## Current status

- Separate local checkout and GitHub remote are configured.
- Arc contracts are deployed. All 33 transactions succeeded; ownership, wiring
  and canonical USDC collateral were verified. Cost: 0.481564 USDC.
- The canonical Arc deployment snapshot is in the contracts package. Application
  cleanup and integration are in progress; do not publish the app until verified.
- No AWS server is currently available. Run the Host on the operator's laptop
  during development; public access still requires HTTPS/WSS connectivity.
- The application target is **https://livestreak-mainnet.vercel.app**, using a
  separate Vercel project named `livestreak-mainnet`. It has not been deployed yet.
  Do not link or redeploy this checkout into the earlier edition's Vercel project.

## Implemented and verified

The app, CLI, role SDKs and Host select Arc 5042 and import the canonical deployment.
Retired chain backends, snapshots, sponsors, dependencies and local-chain bootstrap
scripts have been removed. Login has no test seed override or test-token faucet.
The CLI keystore/session/state files and browser recovery records use dedicated
mainnet namespaces. Host catalog records are scoped to the deployed Arc registry.

The deployment journal records 33 successful transactions, costing 0.481564 USDC.
Ownership, wiring, contract code and real-USDC getters were checked. The real Host
reader successfully enumerated the Arc registry; no mainnet markets exist yet.

Workspace typechecks and SDK, Host, CLI and frontend builds pass. Solidity tests
pass (154), alongside the offline role, wallet and schema suites. Host tests pass
160/160; frontend tests pass 137/137; CLI tests pass 111 with four optional live
probes skipped. Migration-specific lint passes; repository-wide lint still reports
inherited unused declarations and import-rule violations outside this cleanup.

## Required before public release

Configure independent Turso and media storage, the public Host HTTPS/WSS URL,
and an Arc bundler. Verify the exact Safe configuration and any sponsorship policy.
The application target is `https://livestreak-mainnet.vercel.app`; it is not deployed.

With separately authorized collateral, verify the full journey: broadcast and rules,
fund both sides, reject late funding, resolve, check USDC payouts and LVST claims,
end the stream, then discover and play the verified replay. This has not been run
on mainnet. The remaining 0.128436 USDC deployment balance has not been used for stakes.
Standard Anvil does not reproduce Arc's native USDC rules. ERC-20 collateral uses
six decimals; native gas uses eighteen decimals against the same underlying balance.

## Host configuration

Start from [host/.env.example](host/.env.example), using new mainnet credentials.
The example contains placeholders; it is not a working deployment snapshot.
Provide dedicated database/storage credentials, Arc RPC and wallet-provider
endpoints, and a verified Arc deployment snapshot before enabling indexing and
transactions. Do not reuse a testnet snapshot or `.env`.

For local development, use Node 22 and run the Host and app separately after the
Arc runtime configuration is implemented:

```sh
npm run dev --workspace=@livestreak/host-server
npm run dev --workspace=app
```

The Host defaults to port 8788 and the frontend development server to port 3001. Set
`VITE_HOST_BASE_URL` to the intended Host. For public access, configure a stable
HTTPS/WSS endpoint, the exact app origin, persistent private gateway-grant keys
and storage playback CORS. A laptop Host requires the laptop to remain online.

## Release workflows

The inherited app and Host workflows are manual-only and require the repository
variable `ARC_MAINNET_READY=true`. Leave it unset until migration and verification
are complete. They use separate `livestreak-mainnet-app` and
`livestreak-mainnet-host` images/containers. Configure this repository's own
deployment secrets and mainnet Host environment file before enabling them.
CI still runs on pull requests and pushes to `main`.

## References

- [Arc connection details](https://docs.arc.io/arc/references/connect-to-arc)
- [USDC interfaces and decimals](https://docs.arc.io/arc/references/contract-addresses)
- [Porting contracts to Arc](https://docs.arc.io/arc/tutorials/porting-contracts-to-arc)
- [Transfer event emitters](https://docs.arc.io/arc/references/usdc-system-events)

## Deployment wallet

Dedicated Arc mainnet deployer: `0x961DF4C09a3305a6782B3Bdc20Eff169ef4Fd71d`.
Fund this address with native USDC on **Arc mainnet (5042)** only. Its private
key is stored in this checkout's ignored, owner-readable `.env`; it is not
committed or shared with the original edition. Deployment gas is separate from
market collateral and ongoing sponsorship.
