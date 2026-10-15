import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadDeploySnapshotConfig } from "#config/deployment.js";

const HOST_ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const ARC_SNAPSHOT = resolve(
  HOST_ROOT,
  "../packages/contracts/chains/evm/deployments/arc-mainnet.json"
);

const snapshot = () => JSON.parse(readFileSync(ARC_SNAPSHOT, "utf8")) as {
  chainId: number;
  rpc: string;
  scopes: {
    aa: { contracts: { entryPoint: string; safe4337Module: string } };
    paymaster: { contracts: { verifyingPaymaster: string } };
  };
};

describe("loadDeploySnapshotConfig", () => {
  it("returns the AA fields from the nested deploy snapshot scopes", () => {
    const data = snapshot();
    const config = loadDeploySnapshotConfig(ARC_SNAPSHOT);

    expect(config.chainId).toBe(data.chainId);
    expect(config.rpcUrl).toBe(data.rpc);
    expect(config.entryPoint).toBe(data.scopes.aa.contracts.entryPoint);
    expect(config.safeModule).toBe(data.scopes.aa.contracts.safe4337Module);
  });

  it("is a pure read — it does not mutate process.env", () => {
    const before = process.env.LIVESTREAK_AA_RPC_URL;
    loadDeploySnapshotConfig(ARC_SNAPSHOT);
    expect(process.env.LIVESTREAK_AA_RPC_URL).toBe(before);
  });

  it("throws with an actionable message for a missing snapshot", () => {
    expect(() => loadDeploySnapshotConfig("/no/such/snapshot.json")).toThrow(
      /Missing EVM deployment snapshot/
    );
  });
});
