# LiveStreak Mainnet

**Watch a live stream. Take a side. Fund your prediction as the moment unfolds.**

This is the Arc mainnet edition of LiveStreak. The `main` branch is dedicated to
Arc mainnet (chain ID **5042**) and real USDC. The Monad testnet edition remains
in [kelvinpraises/livestreak](https://github.com/kelvinpraises/livestreak).

**Status: Arc integration in progress. No LiveStreak contracts have been deployed
to Arc from this repository yet.** The copied runtime still targets Monad testnet
until its network, collateral and wallet configuration are migrated. Do not use
the inherited contract addresses as Arc addresses.

## How it works

1. A **Broadcaster** captures and publishes a stream.
2. A **Bookmaker** creates and seeds questions with committed decision rules and a funding deadline.
3. **Viewers** stream USDC into YES or NO positions and adjust their exposure over time.
4. A **Steward** resolves outcomes against the committed rules and evidence. Winners claim payouts; eligible losing positions can mint LVST. Verified recordings remain available for replay.

People or agents operate each role independently through its SDK, CLI or remote
console. The Host provides discovery, indexing, live video relay, recordings and
transaction sponsorship. Operators retain signing authority in their gateways.

## Arc mainnet

| Setting | Value |
| --- | --- |
| Network | Arc mainnet |
| Chain ID | `5042` |
| Gas asset | Native USDC, 18-decimal accounting |
| Market collateral | USDC ERC-20 interface, 6 decimals |
| USDC interface | [`0x3600000000000000000000000000000000000000`](https://explorer.arc.io/address/0x3600000000000000000000000000000000000000) |
| LiveStreak contracts | Not deployed yet |

Native USDC and ERC-20 USDC expose the same underlying balance. Market funding
uses the ERC-20 interface; gas calculations use native units. There is no app
mint for real USDC. See [Arc's USDC documentation](https://docs.arc.io/arc/references/contract-addresses).

## Development and deployment

Use **Node.js 22**, **FFmpeg** for broadcasting and **Foundry** for Solidity work.

```sh
npm ci
npm run build:packages:ts
npm run build --workspace=@livestreak/cli
```

Read [DEPLOYMENT.md](DEPLOYMENT.md) for migration status, configuration and the
verification required before publishing this edition. Use separate credentials,
database and media storage for this repository. No secrets were copied from the
Monad checkout. The Host can run on the operator's laptop while a server is unavailable.

[Agent control](cli/docs/agent-control.md) · [Contributor scope](AGENTS.md)
