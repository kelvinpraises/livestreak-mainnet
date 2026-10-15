// Arc mainnet contracts and ERC-4337 wallet configuration for gateway roles.

import type { ChainAaSettings, EvmWalletInitConfig, WalletChain, WalletInit } from "@livestreak/schema";
import { DEFAULT_DEPLOYMENT, type DeploymentName } from "@livestreak/contracts/evm";
import { loadDeploymentOutput } from "@livestreak/contracts/evm/node";

// What the registry needs to assemble a chain's runtime config. Everything here is a "float" — read
// from settings.json or the host at load, never a pre-baked wallet/contracts blob.
export interface ChainBuildContext {
  readonly caip2: string;
  readonly rpc: string;
  readonly hostUrl: string;
  /** Optional AA tuning (EVM only). Absent => self-paid operations through standard Host paths. */
  readonly aa?: ChainAaSettings;
  /** The derived contracts bag (from deriveContracts), passed in so buildWalletInit can read AA addrs. */
  readonly contracts: Readonly<Record<string, string>>;
}

export interface ChainAdapter {
  /** The @livestreak/wallet createWalletManager switch key. */
  readonly kind: WalletChain;
  /** Does this adapter own the given CAIP-2 id? (Arc mainnet: eip155:5042). */
  matches(caip2: string): boolean;
  /** Flatten the chain's deployment artifact into the canonical Record<string,string> contracts bag. */
  deriveContracts(overrides?: Readonly<Record<string, string>>, deployment?: string, caip2?: string): Record<string, string>;
  /** Build the floating WalletInit the exported wallet manager consumes. */
  buildWalletInit(ctx: ChainBuildContext): WalletInit;
}


// --- EVM adapter (eip155:*) — Safe 4337 AA over the deployed ERC-4337 stack ---

const flattenEvmDeployment = (deployment?: string, caip2?: string): Record<string, string> => {
  const prefix = "@livestreak/contracts/evm/deployments/";
  if (deployment && !deployment.startsWith(prefix)) throw new Error(`Unsupported EVM deployment reference: ${deployment}`);
  const name = deployment?.slice(prefix.length) ?? DEFAULT_DEPLOYMENT;
  if (name !== "arc-mainnet") throw new Error(`Unknown EVM deployment: ${name}`);
  const snapshot = loadDeploymentOutput(name as DeploymentName);
  if (caip2 && caip2 !== `eip155:${snapshot.chainId}`) throw new Error(`Deployment ${name} belongs to eip155:${snapshot.chainId}, not ${caip2}`);
  // Read fresh from the promoted JSON at call time so a redeploy is picked up without a rebuild.
  const s = snapshot.scopes;
  const aa = s.aa.contracts;
  const protocol = s.protocol.contracts;
  const streaming = s.streaming.contracts;
  const wire = s.wire.contracts;
  if (aa === undefined || protocol === undefined || streaming === undefined || wire === undefined) {
    throw new Error(`EVM deployment ${name} is missing contract scopes`);
  }
  return {
    entryPoint: aa.entryPoint,
    safeSingleton: aa.safeSingleton,
    safeProxyFactory: aa.safeProxyFactory,
    safeModuleSetup: aa.safeModuleSetup,
    safe4337Module: aa.safe4337Module,
    multiSend: aa.multiSend,
    multiSendCallOnly: aa.multiSendCallOnly,
    fallbackHandler: aa.fallbackHandler,
    signMessageLib: aa.signMessageLib,
    createCall: aa.createCall,
    simulateTxAccessor: aa.simulateTxAccessor,
    marketRegistry: protocol.marketRegistry,
    vault: protocol.vault,
    usdc: protocol.usdc,
    lvstToken: protocol.lvstToken,
    treasury: protocol.treasury,
    stewardRegistry: protocol.stewardRegistry,
    dripsStreaming: streaming.dripsProxy,
    vaultDriver: wire.vaultDriver,
    marketDriver: wire.marketDriverProxy
  };
};

const evmChainAdapter: ChainAdapter = {
  kind: "evm",
  matches: (caip2) => caip2 === "eip155:5042",
  deriveContracts: (overrides, deployment, caip2) => ({ ...flattenEvmDeployment(deployment, caip2), ...(overrides ?? {}) }),
  buildWalletInit: (ctx) => {
    const chainId = Number(ctx.caip2.split(":")[1]);
    const hostBase = ctx.hostUrl.replace(/\/$/, "");
    const isSponsored = ctx.aa?.isSponsored ?? false;
    const bundlerUrl = `${hostBase}${ctx.aa?.bundlerPath ?? "/aa/bundler/local"}`;
    const paymasterUrl = `${hostBase}${ctx.aa?.paymasterPath ?? "/aa/paymaster/local"}`;
    const c = ctx.contracts;
    const config = {
      chainId,
      provider: ctx.rpc,
      bundlerUrl,
      ...(isSponsored ? { paymasterUrl } : {}),
      isSponsored,
      useNativeCoins: !isSponsored,
      entryPointAddress: c.entryPoint as `0x${string}`,
      safe4337ModuleAddress: c.safe4337Module as `0x${string}`,
      safeModulesSetupAddress: c.safeModuleSetup as `0x${string}`,
      safeModulesVersion: "0.3.0",
      contractNetworks: {
        [String(chainId)]: {
          safeSingletonAddress: c.safeSingleton as `0x${string}`,
          safeProxyFactoryAddress: c.safeProxyFactory as `0x${string}`,
          multiSendAddress: c.multiSend as `0x${string}`,
          multiSendCallOnlyAddress: c.multiSendCallOnly as `0x${string}`,
          fallbackHandlerAddress: c.fallbackHandler as `0x${string}`,
          signMessageLibAddress: c.signMessageLib as `0x${string}`,
          createCallAddress: c.createCall as `0x${string}`,
          simulateTxAccessorAddress: c.simulateTxAccessor as `0x${string}`
        }
      }
    } as EvmWalletInitConfig;
    return { chain: "evm", seedSource: "signature-derived", config };
  }
};

// --- the registry ---

// Ordered; first matching adapter wins. Append new chains here.
export const chainAdapters: readonly ChainAdapter[] = [
  evmChainAdapter
];

export const resolveChainAdapter = (caip2: string): ChainAdapter => {
  const adapter = chainAdapters.find((a) => a.matches(caip2));
  if (adapter === undefined) {
    throw new Error(
      `No chain adapter for CAIP-2 "${caip2}". Known namespaces: ${chainAdapters
        .map((a) => a.kind)
        .join(", ")}. Add an adapter to cli/src/gateway/auth/chain-registry.ts to support it.`
    );
  }
  return adapter;
};
