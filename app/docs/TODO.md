# Mainnet application readiness

The application targets Arc mainnet and imports the canonical deployed contracts.
There is no test-token faucet. Funding uses real USDC.

Before release, configure the independent Host, database, media bucket and AA provider;
verify password login, broadcaster capture, vault creation, funding, resolution, claims,
and ended-stream replay. A passing build does not prove these live network journeys.
