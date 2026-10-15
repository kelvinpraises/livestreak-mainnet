import { describe, expect, it } from "vitest";
import { parseCatalogChains } from "#features/catalog/readers.js";
describe("explicit catalog chain configuration", () => {
  it("defaults to EVM without activating every checked-in deployment", () => {
    expect(parseCatalogChains(undefined)).toEqual(["evm"]);
  });
  it("supports a deduplicated operator-selected set", () => {
    expect(parseCatalogChains("evm,evm")).toEqual(["evm"]);
  });
  it.each(["", " , ", "ethereum", "evm,other"])(
    "rejects ambiguous configuration %s",
    (raw) => {
      expect(() => parseCatalogChains(raw)).toThrow("LIVESTREAK_CATALOG_CHAINS");
    },
  );
});
