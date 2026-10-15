// --- exports ---

import type { WalletInit } from "@livestreak/schema";
import { LiveStreakConfigError } from "@livestreak/core";

import type { StewardFindingSeverity } from "../model/finding.js";

// StewardRegistry severity enum on Arc: Warm = 0, Hot = 1, Critical = 2.
export const severityToContractValue = (severity: StewardFindingSeverity): number => {
  switch (severity) {
    case "critical":
      return 2;
    case "warning":
      return 1;
    case "info":
      return 0;
  }
};

export interface StewardEvmAddresses {
  readonly stewardRegistry: string;
}

export interface StewardChainConfig {
  readonly walletInit: WalletInit;
  readonly seed: string | Uint8Array;
  readonly addresses: StewardEvmAddresses;
}

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
export const validateStewardEvmAddresses = (input: unknown): StewardEvmAddresses => {
  const record = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const stewardRegistry = typeof record.stewardRegistry === "string" ? record.stewardRegistry.trim() : "";
  if (!EVM_ADDRESS_RE.test(stewardRegistry)) {
    throw new LiveStreakConfigError({
      message: "Steward EVM config requires a valid stewardRegistry address",
      metadata: { details: stewardRegistry }
    });
  }
  return { stewardRegistry };
};
