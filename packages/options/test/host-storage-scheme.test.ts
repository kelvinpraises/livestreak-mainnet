import { describe, expect, it } from "vitest";
import { mapStreamState } from "../src/chains/evm/decode.js";
describe("Host storage pointer", () => {
  it("decodes the published replay pointer and stream end time", () => {
    expect(mapStreamState({ status: 2, scheme: 4, id: "a".repeat(64), updatedAt: 2n, endedAt: 1n })).toMatchObject({ status: "ended", scheme: "host", endedAtMs: 1000 });
  });
});
