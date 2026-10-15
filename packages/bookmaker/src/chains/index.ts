// --- exports ---


import { validateBookmakerChainConfig } from "./config.js";
import { createEvmBookmakerChain } from "./evm/index.js";
import type { BookmakerChain, BookmakerChainConfig } from "./types.js";

export type { BookmakerContractAddresses } from "./addresses.js";
export { hasBookmakerChainAddresses, validateBookmakerChainConfig } from "./config.js";
export type {
  BookmakerChain,
  BookmakerChainConfig,
  BookmakerChainReader,
  BookmakerChainWriter,
  CreateVaultInput,
  CreateVaultResult,
  TxId,
  VaultId
} from "./types.js";
export { asTxId, asVaultId } from "./types.js";

export const createBookmakerChain = (config: BookmakerChainConfig): BookmakerChain => {
  return createEvmBookmakerChain(validateBookmakerChainConfig(config));
};
