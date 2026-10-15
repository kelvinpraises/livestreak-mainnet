import { flattenDeploymentScopes } from "./flatten-deployment.js";
import { arc_mainnetDeployment } from "./deployments/arc-mainnet.js";
import type { EvmAddresses } from "./types.js";

export const addresses: EvmAddresses = {
  "arc-mainnet": flattenDeploymentScopes(arc_mainnetDeployment)
};
