import { $TSContext, exitOnNextTick, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { categoryName } from '../../../constants';
import { layerConfigurationFileName, LegacyFilename, versionHash } from './constants';
import { loadPluginFromFactory } from './functionPluginLoader';
// eslint-disable-next-line import/no-cycle
import { writeLayerConfigurationFile } from './layerConfiguration';
import { defaultLayerPermission, LayerPermission, LayerRuntime, PermissionEnum } from './layerParams';

/**
 * Layer config state
 */
export const enum LegacyState {
  NOT_LEGACY,
  MULTI_ENV_LEGACY,
  SINGLE_ENV_LEGACY,
}

/**
 * Layer permission
 */
export const enum LegacyPermissionEnum {
  /* eslint-disable @typescript-eslint/naming-convention */
  AwsAccounts = 'awsAccounts',
  AwsOrg = 'awsOrg',
  Private = 'private',
  Public = 'public',
  /* eslint-enable */
}

/**
 * Layer permission object
 */
export type LegacyPermission = { type: LegacyPermissionEnum; accounts?: string[]; orgs?: string[] };

type LegacyRuntime = {
  value: 'nodejs' | 'python';
  name: 'NodeJS' | 'Python';
  layerExecutablePath: string;
  cloudTemplateValue: string;
};

type LegacyVersionMap = {
  [key: string]: {
    permissions: LegacyPermission[];
    hash?: string;
  };
};

type LegacyLayerParametersJson = {
  [layerVersionMapKey]: LegacyVersionMap;
  runtimes: LegacyRuntime[];
};

const layerVersionMapKey = 'layerVersionMap';

/**
 * Migrate to latest layer config
 */
export const migrateLegacyLayer = async (context: $TSContext, layerName: string): Promise<boolean> => {
  const layerDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, layerName);
  const legacyState = getLegacyLayerState(layerName);

  if (legacyState === LegacyState.NOT_LEGACY) {
    return false;
  }

  printer.blankLine();
  printer.warn('Amplify updated the way Lambda layers work to better support team workflows and additional features.');
  printer.info(
    'This change requires a migration. Amplify will create a new Lambda layer version even if no layer content changes are made.',
  );

  if (context?.exeInfo?.inputParams?.yes !== true) {
    const shouldProceedWithMigration = await context.amplify.confirmPrompt('Continue?');
    if (!shouldProceedWithMigration) {
      exitOnNextTick(0);
    }
  }

  const layerConfiguration: { permissions: LayerPermission[]; runtimes: Partial<LayerRuntime>[]; nonMultiEnv?: boolean } = {
    permissions: undefined,
    runtimes: undefined,
  };
  let legacyRuntimeArray: LegacyRuntime[];
  let layerVersionMap: LegacyVersionMap;

  if (legacyState === LegacyState.MULTI_ENV_LEGACY) {
    legacyRuntimeArray = readLegacyRuntimes(layerName, legacyState);
    layerVersionMap = stateManager.getMeta()?.[categoryName]?.[layerName]?.[layerVersionMapKey] ?? {};
  } else {
    ({ layerVersionMap, runtimes: legacyRuntimeArray } = readLegacyLayerParametersJson(layerDirPath));
    layerConfiguration.nonMultiEnv = true;
  }

  /* eslint-disable no-param-reassign */
  const runtimeCloudTemplateValues = legacyRuntimeArray.map((legacyRuntime) => legacyRuntime.cloudTemplateValue);
  legacyRuntimeArray.forEach((runtime: LegacyRuntime) => {
    runtime.cloudTemplateValue = undefined;
  });
  layerConfiguration.runtimes = legacyRuntimeArray;

  await Promise.all(
    layerConfiguration.runtimes.map(async (runtime) => {
      if (runtime.value === 'nodejs') {
        runtime.runtimePluginId = 'amplify-nodejs-function-runtime-provider';
      } else if (runtime.value === 'python') {
        runtime.runtimePluginId = 'amplify-python-function-runtime-provider';
      }
      const runtimePlugin = await loadPluginFromFactory(runtime.runtimePluginId, 'functionRuntimeContributorFactory', context);
      const runtimeInfo = await runtimePlugin.contribute({ selection: runtime.value });
      runtime.layerExecutablePath = runtimeInfo.runtime.layerExecutablePath;
    }),
  );
  /* eslint-enable */

  const layerVersions = Object.keys(layerVersionMap)
    .map((version) => parseInt(version, 10))
    .sort((a, b) => b - a);

  const permissions: LegacyPermission[] = layerVersionMap[`${_.first(layerVersions)}`]?.permissions;

  if (permissions === undefined) {
    printer.warn(`Unable to find layer permissions for ${layerName}, falling back to default.`);
    layerConfiguration.permissions = [defaultLayerPermission];
  } else {
    layerConfiguration.permissions = [];
    permissions.forEach((permission) => {
      switch (permission.type) {
        case LegacyPermissionEnum.Private:
          layerConfiguration.permissions.push({ type: PermissionEnum.Private });
          break;
        case LegacyPermissionEnum.AwsAccounts:
          layerConfiguration.permissions.push({ type: PermissionEnum.AwsAccounts, accounts: permission.accounts });
          break;
        case LegacyPermissionEnum.AwsOrg:
          layerConfiguration.permissions.push({ type: PermissionEnum.AwsOrg, orgs: permission.orgs });
          break;
        case LegacyPermissionEnum.Public:
          layerConfiguration.permissions.push({ type: PermissionEnum.Public });
          break;
        default:
          throw new Error('Failed to determine permission type.');
      }
    });
  }

  stateManager.setResourceParametersJson(undefined, categoryName, layerName, {
    runtimes: runtimeCloudTemplateValues.length > 0 ? runtimeCloudTemplateValues : undefined,
    description: '',
  });

  migrateAmplifyProjectFiles(layerName, 'legacyLayerMigration');
  writeLayerConfigurationFile(layerName, layerConfiguration);

  fs.removeSync(path.join(layerDirPath, LegacyFilename.layerRuntimes));
  fs.removeSync(path.join(layerDirPath, LegacyFilename.layerParameters));
  return true;
};

/**
 * Get layer state
 */
export const getLegacyLayerState = (layerName: string): LegacyState => {
  const layerDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, layerName);
  if (fs.existsSync(path.join(layerDirPath, LegacyFilename.layerParameters))) {
    return LegacyState.SINGLE_ENV_LEGACY;
  }

  if (fs.existsSync(path.join(layerDirPath, LegacyFilename.layerRuntimes))) {
    return LegacyState.MULTI_ENV_LEGACY;
  }

  if (fs.existsSync(path.join(layerDirPath, layerConfigurationFileName))) {
    return LegacyState.NOT_LEGACY;
  }

  throw new Error(`Lambda layer ${layerName} is missing a state file. Try running "amplify pull --restore". If the issue persists, recreating the layer is the best option. \
${chalk.red('Ensure your layer content is backed up!')}`);
};

/**
 * get layer runtime
 */
export const readLegacyRuntimes = (layerName: string, legacyState: LegacyState): LegacyRuntime[] => {
  const layerDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, layerName);
  if (legacyState === LegacyState.SINGLE_ENV_LEGACY) {
    return readLegacyLayerParametersJson(layerDirPath).runtimes;
  }
  if (legacyState === LegacyState.MULTI_ENV_LEGACY) {
    return JSONUtilities.readJson<LegacyRuntime[]>(path.join(layerDirPath, LegacyFilename.layerRuntimes));
  }
  return undefined;
};

const readLegacyLayerParametersJson = (layerDirPath: string): LegacyLayerParametersJson =>
  JSONUtilities.readJson<LegacyLayerParametersJson>(path.join(layerDirPath, LegacyFilename.layerParameters));

const migrateAmplifyProjectFiles = (layerName: string, latestLegacyHash: string): void => {
  const projectRoot = pathManager.findProjectRoot();
  const meta = stateManager.getMeta(projectRoot);

  if (meta?.[categoryName]?.[layerName]?.[layerVersionMapKey]) {
    meta[categoryName][layerName][layerVersionMapKey] = undefined;
  }

  _.setWith(meta, [categoryName, layerName, versionHash], latestLegacyHash);
  stateManager.setMeta(projectRoot, meta);
};
