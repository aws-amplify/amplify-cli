/**
 * Since all schemas are on v1 right now, no upgrades are necessary.
 * The following is provided as a "noop" upgrade function implementation.
 *
 * Once there are multiple versions of a schema, we will need to implement a conversion pipeline for it here.
 */

import { v1toV2Upgrade } from './authVersionUpgrades';
import { VersionUpgradePipeline } from './HeadlessInputValidator';

export const noopUpgradePipeline: VersionUpgradePipeline = () => [];

export const authUpgradePipeline: VersionUpgradePipeline = version => {
  const minVersion = 1;
  const maxVersion = 2;
  if (version < minVersion || maxVersion < version) {
    throw new Error(`Headless auth upgrade pipeline encountered unknown schema version ${version}`);
  }

  const upgradePipeline = [v1toV2Upgrade];
  return upgradePipeline.slice(version - 1);
};
