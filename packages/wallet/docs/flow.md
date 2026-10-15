# Wallet flow

1. A password derives the operator seed; no development seed override is used.
2. The EVM manager derives the Safe address from the Arc deployment's AA contracts.
3. Reads use the Arc RPC. Writes use the configured ERC-4337 bundler.
4. Optional sponsorship uses an explicitly configured paymaster.
5. The submitted operation identity is retained while receipts are polled.

The application stores its connection state under dedicated mainnet keys. Native gas
and ERC-20 collateral draw on the same USDC balance with different decimal representations.
