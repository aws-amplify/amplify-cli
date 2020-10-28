/**
 * Since all schemas are on v1 right now, no upgrades are necessary.
 * The following is provided as a "noop" upgrade function implementation.
 *
 * Once there are multiple versions of a schema, we will need to implement a conversion pipeline for it here.
 */

import { VersionUpgradePipeline } from './HeadlessInputValidator';

export const noopUpgradePipeline: VersionUpgradePipeline = () => [];
