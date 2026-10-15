# LiveStreak Mainnet

**Watch a live stream. Take a side. Fund your prediction as the moment unfolds.**

This is the Arc mainnet edition of LiveStreak. The `main` branch is dedicated to
Arc mainnet (chain ID **5042**) and real USDC. Arc is the only production network
for this repository.

**Status: contracts deployed and deployment wiring verified on Arc mainnet.**
Application integration and the Arc-only cleanup are in progress. A complete
mainnet market lifecycle has not been verified yet; the public application is not live.

Planned application URL: **https://livestreak-mainnet.vercel.app**.
This URL is the target for this edition; the Arc application is not deployed yet.

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
| LiveStreak contracts | Deployed; see the table below |

Native USDC and ERC-20 USDC expose the same underlying balance. Market funding
uses the ERC-20 interface; gas calculations use native units. There is no app
mint for real USDC. See [Arc's USDC documentation](https://docs.arc.io/arc/references/contract-addresses).

## Deployed contracts

| Contract | Arc mainnet address |
| --- | --- |
| Protocol | [`0x14a62901c36897767f8bef733647f738861f5198`](https://explorer.arc.io/address/0x14a62901c36897767f8bef733647f738861f5198) |
| MarketRegistry | [`0x6cb771f7ad244cee35c54254e1be9e9aa663cb72`](https://explorer.arc.io/address/0x6cb771f7ad244cee35c54254e1be9e9aa663cb72) |
| Vault | [`0xd3db668d05ef6cfa1cccd799e0018aeb39964cd7`](https://explorer.arc.io/address/0xd3db668d05ef6cfa1cccd799e0018aeb39964cd7) |
| Drips proxy | [`0x9f0e47c423e84d7f2acdd6190f73186a8b3ebc39`](https://explorer.arc.io/address/0x9f0e47c423e84d7f2acdd6190f73186a8b3ebc39) |
| MarketDriver proxy | [`0x91557e6544146afc4e03da72e6c30c2c14b92fbb`](https://explorer.arc.io/address/0x91557e6544146afc4e03da72e6c30c2c14b92fbb) |
| VaultDriver | [`0xbc96c015c12d53bfbf69b7eb12da6092191a0cb0`](https://explorer.arc.io/address/0xbc96c015c12d53bfbf69b7eb12da6092191a0cb0) |
| StewardRegistry | [`0x3796969791f717ed51394d66a1ea5202fee00e8b`](https://explorer.arc.io/address/0x3796969791f717ed51394d66a1ea5202fee00e8b) |
| Treasury | [`0xba19f56b176dee3365728af5b263b16174fc610e`](https://explorer.arc.io/address/0xba19f56b176dee3365728af5b263b16174fc610e) |
| LVST | [`0xd123fec12bdd6f095705b5c38e25bc09a18d3b25`](https://explorer.arc.io/address/0xd123fec12bdd6f095705b5c38e25bc09a18d3b25) |
| Caller | [`0xb731ee8592d6df8143c3c2702498cf6b1023444c`](https://explorer.arc.io/address/0xb731ee8592d6df8143c3c2702498cf6b1023444c) |

Deployment: **33 successful transactions, 0.48156400 USDC**. [Canonical snapshot](packages/contracts/chains/evm/deployments/arc-mainnet.json) · [Verification receipts](packages/contracts/chains/evm/deployments/arc-mainnet-verification.json).

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
original checkout. The Host can run on the operator's laptop while a server is unavailable.

[Agent control](cli/docs/agent-control.md) · [Contributor scope](AGENTS.md)
