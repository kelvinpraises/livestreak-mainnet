// --- exports ---


import type { UserAddress } from "../model/ids.js";
import { validateOptionsChainConfig } from "./config.js";
import { resolveEvmAccountAddress } from "./evm/account.js";
import { createEvmOptionsChain } from "./evm/index.js";
import type { OptionsChain, OptionsChainConfig } from "./types.js";

export type { OptionsContractAddresses } from "./evm/addresses.js";
export { validateOptionsChainConfig } from "./config.js";
export type {
  ApproveNftInput,
  AdvanceInput,
  ClaimLossLvstInput,
  FundStreamInput,
  LaneWriteInput,
  MintNftInput,
  MintResult,
  MintWithSaltInput,
  OptionsChain,
  OptionsChainConfig,
  OptionsReader,
  OptionsWriter,
  SetApprovalForAllInput,
  SetLanesInput,
  StakeLvstInput,
  StopAllFundingInput,
  StopFundingInput,
  TransferNftInput,
  TxId,
  UnstakeLvstInput,
  WithdrawInput,
  WithdrawManyInput
} from "./types.js";
export { asTxId } from "./types.js";

export const createOptionsChain = (config: OptionsChainConfig): OptionsChain => {
  const validated = validateOptionsChainConfig(config);
  return createEvmOptionsChain(validated);
};

export const resolveOptionsAccountAddress = async (config: OptionsChainConfig): Promise<UserAddress> => {
  return resolveEvmAccountAddress(validateOptionsChainConfig(config));
};
