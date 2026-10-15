import { parseAbi, type Address, type PublicClient, type WalletClient } from "viem";
import { ARC_MAINNET } from "../../network.js";
import { deployFromArtifact, type ScopeResult } from "../utils.js";

const LABEL = "livestreak.arc.mainnet";

export async function deployProtocol(
  client: PublicClient,
  walletClient: WalletClient,
  _previousScopes: Record<string, ScopeResult>,
  config: { chain: string; rpc: string; deployer: Address; deploymentLabel?: string }
): Promise<ScopeResult> {
  console.log("Deploying LiveStreak protocol contracts...");
  const { deployer } = config;
  const label = config.deploymentLabel ?? LABEL;

  try {
    if (config.chain !== ARC_MAINNET.deployment || await client.getChainId() !== ARC_MAINNET.chainId) {
      throw new Error("This edition deploys only to Arc mainnet (5042)");
    }
    const usdc = ARC_MAINNET.collateral.address;
    const decimals = await client.readContract({ address: usdc, abi: parseAbi(["function decimals() view returns (uint8)"]), functionName: "decimals" });
    if (decimals !== ARC_MAINNET.collateral.decimals) throw new Error("Unexpected Arc USDC decimals");
    const protocol = await deployFromArtifact(
      walletClient,
      client,
      "out/Protocol.sol/Protocol.json",
      [deployer],
      undefined,
      `${label}.protocol`
    );

    const marketRegistry = await deployFromArtifact(
      walletClient,
      client,
      "out/MarketRegistry.sol/MarketRegistry.json",
      [deployer, protocol],
      undefined,
      `${label}.marketRegistry`
    );

    const vault = await deployFromArtifact(
      walletClient,
      client,
      "out/Vault.sol/Vault.json",
      [protocol],
      undefined,
      `${label}.vault`
    );

    const lvstToken = await deployFromArtifact(
      walletClient,
      client,
      "out/LvstToken.sol/LvstToken.json",
      [protocol],
      undefined,
      `${label}.lvstToken`
    );

    const treasury = await deployFromArtifact(
      walletClient,
      client,
      "out/Treasury.sol/Treasury.json",
      [deployer, usdc, protocol],
      undefined,
      `${label}.treasury`
    );

    const stewardRegistry = await deployFromArtifact(
      walletClient,
      client,
      "out/StewardRegistry.sol/StewardRegistry.json",
      [deployer, protocol],
      undefined,
      `${label}.stewardRegistry`
    );

    return {
      status: "completed",
      deployedAt: new Date().toISOString(),
      contracts: {
        protocol,
        marketRegistry,
        vault,
        usdc,
        lvstToken,
        treasury,
        stewardRegistry
      }
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
