# Arc application verification

Run `./dev.sh` with Node 22 after configuring the mainnet Host and dedicated storage.
App: http://localhost:3001. Host: http://127.0.0.1:8788.

Verify homepage discovery, password login, a real broadcaster stream, committed vault
rules, authorized funding, Steward resolution, claims, and replay discovery.
Do not automatically mint collateral, reset shared storage, or spend deployment funds.
A complete real-USDC lifecycle has not yet been verified in this edition.
