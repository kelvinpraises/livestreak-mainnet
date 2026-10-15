import { LiveStreakConfigError } from "@livestreak/core";
import type { StewardContractExecutor } from "../runtime/adapters/action-plan-sink.js";
import { createEvmStewardExecutor } from "./evm.js";
import { validateStewardEvmAddresses, type StewardChainConfig } from "./types.js";
export type { StewardChainConfig, StewardEvmAddresses } from "./types.js";
export const validateStewardChainConfig = (config: StewardChainConfig): StewardChainConfig => {
  if (config.walletInit.chain !== "evm") throw new LiveStreakConfigError({ message: "Only Arc EVM wallets are supported" });
  return { ...config, addresses: validateStewardEvmAddresses(config.addresses) };
};
export const createStewardContractExecutor = (config: StewardChainConfig): StewardContractExecutor =>
  createEvmStewardExecutor(validateStewardChainConfig(config));
