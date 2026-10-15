import type { WalletChain } from "@livestreak/wallet";
import type { StewardSubject } from "../../model/subject.js";
import type { ContractFactSource } from "../sources.js";
import type { StewardFact } from "../../workflow/facts/fact.js";
import { buildStewardFact } from "./fact.js";

// --- Contract fact source (WAVE 5 BUILD) ---
//
// The injected Arc reader supplies contract values; this adapter converts them into facts.

export interface ContractVaultFact {
  readonly key: string;
  readonly value: unknown;
  readonly evidenceRefs?: readonly string[];
  readonly observedAtMs?: number;
}

export interface ContractVaultReader {
  readonly chain: WalletChain;
  readonly readVaultFacts: (subject: StewardSubject) => Promise<readonly ContractVaultFact[]>;
}

export const createContractFactSource = (reader: ContractVaultReader): ContractFactSource => ({
  readFacts: async (subject: StewardSubject): Promise<readonly StewardFact[]> => {
    const facts = await reader.readVaultFacts(subject);
    return facts.map((fact) =>
      buildStewardFact("contract", {
        subject,
        key: fact.key,
        value: fact.value,
        ...(fact.evidenceRefs === undefined ? {} : { evidenceRefs: fact.evidenceRefs }),
        ...(fact.observedAtMs === undefined ? {} : { observedAtMs: fact.observedAtMs })
      })
    );
  }
});
