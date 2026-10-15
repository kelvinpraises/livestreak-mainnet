import type { EvmDeployOutput } from "@livestreak/contracts/evm";
import { deploymentPath, readDeploymentOutputFromPath } from "@livestreak/contracts/evm/node";
import type { CatalogChain } from "@livestreak/host";
import {
  asMarketId,
  asVaultId,
  createOptionsChain,
  readVaultSnapshot,
  type OptionsContractAddresses,
  type OptionsMarketSnapshot,
  type OptionsReader,
  type OptionsVaultSnapshot
} from "@livestreak/options";
import type { WalletInit } from "@livestreak/schema";
import type { CatalogReaderProvider } from "./catalog.js";

const READONLY_EVM_SEED =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Parse the EVM deploy snapshot through the single contracts parser (no local JSON.parse of the AA
// snapshot), degrading to null so an absent/unparseable snapshot just omits the EVM reader.
const readEvmSnapshot = (path: string): EvmDeployOutput | null => {
  try {
    const snapshot = readDeploymentOutputFromPath(path);
    if (snapshot.chainId !== 5042) return null;
    return snapshot;
  } catch {
    return null;
  }
};

// Map the EVM deploy snapshot scopes onto the options contract address set.
const evmAddressesFromSnapshot = (
  snap: EvmDeployOutput
): OptionsContractAddresses | null => {
  const protocol = snap.scopes?.protocol?.contracts;
  const streaming = snap.scopes?.streaming?.contracts;
  const wire = snap.scopes?.wire?.contracts;
  const marketRegistry = protocol?.marketRegistry;
  const vault = protocol?.vault;
  const marketDriver = wire?.marketDriverProxy ?? wire?.marketDriverLogic;
  const stewardRegistry = protocol?.stewardRegistry;
  const treasury = protocol?.treasury;
  const lvstToken = protocol?.lvstToken;
  const dripsStreaming = streaming?.dripsProxy;
  if (
    marketRegistry === undefined ||
    vault === undefined ||
    marketDriver === undefined ||
    stewardRegistry === undefined ||
    treasury === undefined ||
    lvstToken === undefined ||
    dripsStreaming === undefined
  ) {
    return null;
  }
  return {
    marketRegistry: marketRegistry as `0x${string}`,
    vault: vault as `0x${string}`,
    marketDriver: marketDriver as `0x${string}`,
    stewardRegistry: stewardRegistry as `0x${string}`,
    treasury: treasury as `0x${string}`,
    lvstToken: lvstToken as `0x${string}`,
    dripsStreaming: dripsStreaming as `0x${string}`
  };
};

const buildEvmReader = (): OptionsReader | null => {
  const snapshotPath = process.env.LIVESTREAK_DEPLOY_SNAPSHOT ?? deploymentPath();
  const snap = readEvmSnapshot(snapshotPath);
  if (snap === null) return null;
  const addresses = evmAddressesFromSnapshot(snap);
  if (addresses === null) return null;
  const rpcUrl = process.env.LIVESTREAK_AA_RPC_URL ?? snap.rpc;
  if (rpcUrl === undefined || rpcUrl.length === 0) return null;
  const chainId = Number.parseInt(String(snap.chainId), 10);
  const walletInit = {
    chain: "evm",
    seedSource: "raw",
    config: { provider: rpcUrl, chainId }
  } as unknown as WalletInit;
  try {
    return createOptionsChain({
      walletInit,
      seed: READONLY_EVM_SEED,
      addresses,
      readRpcUrl: rpcUrl,
      includeProtocolSummary: true
    }).reader;
  } catch (error) {
    console.warn(`[catalog]: EVM reader unavailable — ${String(error)}`);
    return null;
  }
};

export const parseCatalogChains = (raw: string | undefined): readonly CatalogChain[] => {
  if (raw === undefined || raw.split(",").every(value => value.trim() === "evm")) return ["evm"];
  throw new Error("LIVESTREAK_CATALOG_CHAINS must be evm for the Arc edition");
};

export const createEnvReaderProvider = (): CatalogReaderProvider => {
  const enabled = parseCatalogChains(process.env.LIVESTREAK_CATALOG_CHAINS);
  const snapshot = readEvmSnapshot(process.env.LIVESTREAK_DEPLOY_SNAPSHOT ?? deploymentPath());
  const registry = snapshot?.scopes.protocol?.contracts?.marketRegistry;
  const deploymentScopes = { evm: registry ? `eip155:5042:${registry.toLowerCase()}` : "unconfigured:evm" };
  let cached: OptionsReader | null | undefined;
  return {
    reader: chain => {
      if (chain !== "evm") return null;
      if (cached === undefined) cached = buildEvmReader();
      return cached;
    },
    deploymentScopes,
    availableChains: enabled
  };
};

// Market shell + per-vault board snapshots for live pool projection (agent-3 pass-4).
export interface CatalogMarketGraph {
  readonly snap: OptionsMarketSnapshot;
  readonly vaultSnapshots: ReadonlyMap<string, OptionsVaultSnapshot>;
}

// Enumerate a market's full on-chain graph for the indexer: market shell, every vault's
// settled state, AND per-vault board snapshots so `projectVaultLivePools` can derive
// `livePoolUSDC` without duplicating accrual math in the host.
export const readMarketGraph = async (
  reader: OptionsReader,
  marketId: string
): Promise<CatalogMarketGraph> => {
  const id = asMarketId(marketId);
  // A replacing DB projection must be complete. One swallowed RPC error would delete
  // valid rows and write fabricated zero aggregates.
  const [market, vaultIds, streamState] = await Promise.all([
    reader.readMarket(id), reader.listMarketVaults(id), reader.readStreamState(id)
  ]);
  const vaults = await Promise.all(vaultIds.map(vaultId => reader.readVault(vaultId)));
  if (!market || String(market.marketId) !== marketId || vaults.some((vault, index) => !vault || String(vault.vaultId) !== String(vaultIds[index]) || String(vault.marketId) !== marketId)) {
    throw new Error('Incomplete or mismatched market graph');
  }
  const snap: OptionsMarketSnapshot = { market, vaults, streamState };
  const vaultSnapshots = new Map<string, OptionsVaultSnapshot>();
  await Promise.all(vaults.map(async vault => {
    if (vault.status === 'resolved') return; // Settled pools are authoritative after resolution.
    const snapshot = await readVaultSnapshot(reader, asVaultId(vault.vaultId));
    if (snapshot.vault.vaultId !== vault.vaultId || snapshot.vault.marketId !== vault.marketId || snapshot.vault.status !== vault.status) {
      throw new Error("Vault changed during index refresh; retry next cycle");
    }
    vaultSnapshots.set(String(vault.vaultId), snapshot);
  }));

  return { snap, vaultSnapshots };
};

// Parse LIVESTREAK_CATALOG_MARKETS="evm:0x.." into Arc seed refs.
export const parseSeedMarkets = (
  raw: string | undefined
): readonly { chain: CatalogChain; marketId: string }[] => {
  if (raw === undefined || raw.trim().length === 0) return [];
  const out: { chain: CatalogChain; marketId: string }[] = [];
  for (const entry of raw.split(",")) {
    const [chainPart, marketId] = entry.split(":");
    const chain = chainPart?.trim();
    const id = marketId?.trim();
    if (chain === "evm" && id !== undefined && id.length > 0) {
      out.push({ chain, marketId: id });
    }
  }
  return out;
};
