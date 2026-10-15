import { Effect } from "effect";
import { LiveStreakConfigError } from "@livestreak/core";
import type { MarketRegistrar, ObserveRunMarketConfig } from "#market/types.js";
import { createEvmMarketRegistrar } from "./evm.js";

export const createMarketRegistrar = (config: ObserveRunMarketConfig): Effect.Effect<MarketRegistrar, LiveStreakConfigError> => {
  if (config.walletInit.chain !== "evm") return Effect.fail(new LiveStreakConfigError({ message: "Only Arc EVM wallets are supported" }));
  return Effect.succeed(createEvmMarketRegistrar(config));
};
