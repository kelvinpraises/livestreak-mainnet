# Arc mainnet deployment

`main` in this repository is dedicated to **Arc mainnet (5042)**. The Monad
testnet edition is maintained separately in `kelvinpraises/livestreak`.

## Current status

- Separate local checkout and GitHub remote are configured.
- No LiveStreak contracts have been deployed to Arc by this repository.
- The copied application, SDK and Host still contain Monad defaults. The existing
  deployment snapshots must not be used as Arc deployments.
- No AWS server is currently available. Run the Host on the operator's laptop
  during development; public access still requires HTTPS/WSS connectivity.
- The existing `livestreak.vercel.app` deployment belongs to the earlier edition;
  it is not evidence that this Arc edition is live.

## Migration before release

1. Introduce an explicit Arc network and deployment configuration shared by the
   application, CLI, SDKs and Host. Verify RPC chain ID 5042 before writes.
2. Configure USDC collateral as `0x3600000000000000000000000000000000000000`.
   Replace the deployment's MockUSDC assumption with configured collateral;
   never deploy a mock collateral token on mainnet.
3. Remove the mainnet test-mint action. Use 6-decimal ERC-20 values for market
   funding and payouts, and 18-decimal native values for gas. Both views share
   one USDC balance. Verify gas reserve behavior without sponsorship.
4. Configure and verify Arc wallet infrastructure and sponsored operations.
   Network support alone is not proof that our exact wallet configuration works.
5. Use a dedicated Turso database and media bucket. Set the catalog deployment
   scope to the real Arc contracts; do not import Monad test records.
6. Verify the lifecycle with small amounts on Arc testnet first, then deploy and
   run a small complete mainnet market: publish stream and rules, fund both sides,
   reject late funding, resolve, verify winner USDC balance changes and losing
   LVST claims, end the stream and discover/play its verified replay.

Record confirmed contract addresses in the contracts package's deployment
snapshot and README. Keep production addresses absent until transactions are
confirmed and the wiring is verified. Standard Anvil does not reproduce Arc's
native USDC rules; use Arc's runtime or the real network for those checks.

## Host configuration

Start from [host/.env.example](host/.env.example), using new mainnet credentials.
The example contains placeholders; it is not a working deployment snapshot.
Provide dedicated database/storage credentials, Arc RPC and wallet-provider
endpoints, and a verified Arc deployment snapshot before enabling indexing and
transactions. Do not reuse a Monad snapshot or `.env`.

For local development, use Node 22 and run the Host and app separately after the
Arc runtime configuration is implemented:

```sh
npm run dev --workspace=@livestreak/host-server
npm run dev --workspace=app
```

The Host defaults to port 8787 and the frontend to port 3000. Set
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
