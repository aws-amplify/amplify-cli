import { $TSContext, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { categoryName } from '../../../constants';
import { layerConfigurationFileName, LegacyFilename, versionHash } from './constants';
import { loadPluginFromFactory } from './functionPluginLoader';
import { writeLayerConfigurationFile } from './layerConfiguration';
import { getLayerDirPath } from './layerHelpers';
import { defaultLayerPermission, LayerPermission, LayerRuntime, PermissionEnum } from './layerParams';

export const enum LegacyPermissionEnum {
  AwsAccounts = 'awsAccounts',
  AwsOrg = 'awsOrg',
  Private = 'private',
  Public = 'public',
}

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

const enum LegacyState {
  NOT_LEGACY,
  MULTI_ENV_LEGACY,
  SINGLE_ENV_LEGACY,
}

const layerVersionMapKey = 'layerVersionMap';

export async function migrateLegacyLayer(context: $TSContext, layerName: string): Promise<boolean> {
  const layerDirPath = getLayerDirPath(layerName);
  const legacyState = isLegacyLayer(layerName, layerDirPath);

  if (legacyState === LegacyState.NOT_LEGACY) {
    return false;
  }

  const runtimeCloudTemplateValues: string[] = [];
  const layerConfiguration: { permissions: LayerPermission[]; runtimes: LayerRuntime[]; nonMultiEnv?: boolean } = {
    permissions: undefined,
    runtimes: undefined,
  };
  let legacyRuntimeArray: LegacyRuntime[];
  let layerVersionMap: LegacyVersionMap;

  if (legacyState === LegacyState.MULTI_ENV_LEGACY) {
    legacyRuntimeArray = JSONUtilities.readJson<LegacyRuntime[]>(path.join(layerDirPath, LegacyFilename.layerRuntimes));
    layerVersionMap = _.get(stateManager.getMeta(), [categoryName, layerName, layerVersionMapKey], {});
  } else {
    ({ layerVersionMap, runtimes: legacyRuntimeArray } = JSONUtilities.readJson<{
      [layerVersionMapKey]: LegacyVersionMap;
      runtimes: LegacyRuntime[];
    }>(path.join(layerDirPath, LegacyFilename.layerParameters)));
    layerConfiguration.nonMultiEnv = true;
  }

  legacyRuntimeArray
    .map(legacyRuntime => legacyRuntime.cloudTemplateValue)
    .forEach((cloudTemplateValue: string) => {
      runtimeCloudTemplateValues.push(cloudTemplateValue);
    });

  legacyRuntimeArray.forEach((runtime: LegacyRuntime) => delete runtime.cloudTemplateValue);
  layerConfiguration.runtimes = legacyRuntimeArray;

  await Promise.all(
    layerConfiguration.runtimes.map(async runtime => {
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

  const layerVersions = Object.keys(layerVersionMap)
    .map(version => parseInt(version, 10))
    .sort((a, b) => b - a);

  const permissions: LegacyPermission[] = layerVersionMap[`${_.first(layerVersions)}`]?.permissions;

  if (permissions === undefined) {
    context.print.warning('Unable to find layer permissions, falling back to default.');
    layerConfiguration.permissions = [defaultLayerPermission];
  } else {
    layerConfiguration.permissions = [];
    permissions.map(permission => {
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
    runtimes: runtimeCloudTemplateValues,
    description: '',
  });

  migrateAmplifyProjectFiles(layerName, 'legacyLayerMigration', context.amplify.getEnvInfo().envName);
  writeLayerConfigurationFile(layerName, layerConfiguration);

  fs.removeSync(path.join(layerDirPath, LegacyFilename.layerRuntimes));
  fs.removeSync(path.join(layerDirPath, LegacyFilename.layerParameters));
  return true;
}

function isLegacyLayer(layerName: string, layerDirPath: string): LegacyState {
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
}

function migrateAmplifyProjectFiles(layerName: string, latestLegacyHash: string, envName?: string) {
  const projectRoot = pathManager.findProjectRoot();
  removeLayerFromTeamProviderInfo(envName, layerName, projectRoot);
  const meta = stateManager.getMeta(projectRoot);

  if (_.get(meta, [categoryName, layerName, layerVersionMapKey], undefined)) {
    delete meta[categoryName][layerName][layerVersionMapKey];
  }

  _.set(meta, [categoryName, layerName, versionHash], latestLegacyHash);
  stateManager.setMeta(projectRoot, meta);
}

export function removeLayerFromTeamProviderInfo(envName: string, layerName: string, projectRoot?: string) {
  const nonCfnDataKey = 'nonCFNdata';
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectRoot);

  _.unset(teamProviderInfo, [envName, nonCfnDataKey, categoryName, layerName]);
  if (_.isEmpty(_.get(teamProviderInfo, [envName, nonCfnDataKey, categoryName]))) {
    _.unset(teamProviderInfo, [envName, nonCfnDataKey, categoryName]);
    if (_.isEmpty(_.get(teamProviderInfo, [envName, nonCfnDataKey]))) {
      _.unset(teamProviderInfo, [envName, nonCfnDataKey]);
    }
  }
  stateManager.setTeamProviderInfo(projectRoot, teamProviderInfo);
}
