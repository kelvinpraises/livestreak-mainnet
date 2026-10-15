import { describe, expect, it } from "vitest";
import { validateStewardChainConfig } from "../src/chains/index.js";
import { severityToContractValue } from "../src/chains/types.js";
describe("steward chain config", () => {
  it("rejects a malformed registry before creating a writer", () => {
    expect(() => validateStewardChainConfig({ walletInit: { chain: "evm" } as never, seed: "test-seed", addresses: { stewardRegistry: "not-an-address" } })).toThrow(/valid stewardRegistry address/);
  });
  it("maps finding severity onto the on-chain enum (Warm/Hot/Critical)", () => {
    expect(severityToContractValue("info")).toBe(0);
    expect(severityToContractValue("warning")).toBe(1);
    expect(severityToContractValue("critical")).toBe(2);
  });
});
