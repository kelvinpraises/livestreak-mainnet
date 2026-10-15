import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildDefaultSettings, ensureSettings, loadSettings } from "../src/prefs/settings.js";
import { resolveChainAdapter } from "../src/gateway/auth/chain-registry.js";

describe("prefs/settings", () => {
  it("buildDefaultSettings floats the wallet/contracts blob (deployment ref, no baked addresses)", () => {
    const doc = buildDefaultSettings("http://127.0.0.1:8788");
    expect(doc.host.url).toBe("http://127.0.0.1:8788");
    expect(doc.defaultChain).toBe("eip155:5042");
    const chain = doc.chains["eip155:5042"];
    expect(chain?.deployment).toBe("@livestreak/contracts/evm/deployments/arc-mainnet");
    // Contracts are NOT baked into settings.json — the chain adapter derives them from the deployment.
    expect(chain?.contracts).toBeUndefined();
    const contracts = resolveChainAdapter("eip155:5042").deriveContracts(undefined, chain.deployment, doc.defaultChain);
    expect(contracts.marketRegistry).toBe("0x6cb771f7ad244cee35c54254e1be9e9aa663cb72");
    expect(contracts.dripsStreaming).toBe("0x9f0e47c423e84d7f2acdd6190f73186a8b3ebc39");
    expect(() => resolveChainAdapter("eip155:31337").deriveContracts(undefined, chain.deployment, "eip155:31337")).toThrow("No chain adapter");
    expect(() => resolveChainAdapter("eip155:421614").deriveContracts(undefined, chain.deployment, "eip155:421614")).toThrow("No chain adapter");
    expect(() => resolveChainAdapter("eip155:5042").deriveContracts(undefined, "@livestreak/contracts/evm/deployments/unknown", doc.defaultChain)).toThrow("Unknown EVM");
  });

  it("ensureSettings auto-creates settings.json on first access", async () => {
    const dir = await mkdtemp(join(tmpdir(), "livestreak-settings-"));
    const path = join(dir, "settings.json");
    const doc = await ensureSettings(path);
    expect(doc.host.url).toBe("http://127.0.0.1:8788");
    const raw = await readFile(path, "utf8");
    expect(raw).not.toContain("seed");
    const roundTrip = await loadSettings(path);
    expect(roundTrip.defaultChain).toBe(doc.defaultChain);
  });
});
