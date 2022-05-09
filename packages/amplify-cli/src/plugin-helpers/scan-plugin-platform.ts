/* eslint-disable no-param-reassign */
import { $TSAny, isPackaged, JSONUtilities } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import sequential from 'promise-sequential';
import { constants } from '../domain/constants';
import { PluginCollection } from '../domain/plugin-collection';
import { PluginInfo } from '../domain/plugin-info';
import { PluginManifest } from '../domain/plugin-manifest';
import { PluginPlatform } from '../domain/plugin-platform';
import { getGlobalNodeModuleDirPath } from '../utils/global-prefix';
import isChildPath from '../utils/is-child-path';
import { readPluginsJsonFile, writePluginsJsonFile } from './access-plugins-file';
import { twoPluginsAreTheSame } from './compare-plugins';
import { checkPlatformHealth } from './platform-health-check';
import { verifyPlugin } from './verify-plugin';

/**
 * scan for platform plugins, including both core and custom plugins
 */
export const scanPluginPlatform = async (pluginPlatform?: PluginPlatform): Promise<PluginPlatform> => {
  pluginPlatform = pluginPlatform || readPluginsJsonFile() || new PluginPlatform();

  pluginPlatform!.plugins = new PluginCollection();

  await addCore(pluginPlatform!);

  if (pluginPlatform!.userAddedLocations && pluginPlatform!.userAddedLocations.length > 0) {
    // clean up the userAddedLocation first
    pluginPlatform!.userAddedLocations = pluginPlatform!.userAddedLocations.filter(pluginDirPath => {
      const result = fs.existsSync(pluginDirPath);
      return result;
    });

    const scanUserLocationTasks = pluginPlatform!.userAddedLocations.map(
      pluginDirPath => async () => verifyAndAdd(pluginPlatform!, pluginDirPath),
    );
    await sequential(scanUserLocationTasks);
  }

  if (isPackaged) {
    pluginPlatform!.pluginDirectories.push(constants.PackagedNodeModules);
  }

  if (pluginPlatform!.pluginDirectories.length > 0 && pluginPlatform!.pluginPrefixes.length > 0) {
    const scanDirTasks = pluginPlatform!.pluginDirectories.map(directory => async () => {
      directory = normalizePluginDirectory(directory);
      // adding subDir based on amplify-
      const subDirNames = await fs.readdir(directory);
      // adding plugin based on @aws-amplify/amplify-
      if (subDirNames.includes('@aws-amplify')) {
        const nameSpacedDir = path.join(directory, '@aws-amplify');
        const nameSpacedPackages = await fs.readdir(nameSpacedDir);
        await addPluginPrefixWithMatchingPattern(nameSpacedPackages, nameSpacedDir, pluginPlatform!);
      } else {
        await addPluginPrefixWithMatchingPattern(subDirNames, directory, pluginPlatform!);
      }
    });

    await sequential(scanDirTasks);
  }

  pluginPlatform!.lastScanTime = new Date();
  writePluginsJsonFile(pluginPlatform!);

  await checkPlatformHealth(pluginPlatform);

  return pluginPlatform;
};

/**
 * get core plugin directory path
 */
export const getCorePluginDirPath = (): string => path.join(__dirname, '..', '..');

/**
 * get version from root package.json
 */
export const getCorePluginVersion = (): string => {
  const packageJsonFilePath = path.join(__dirname, '..', '..', 'package.json');
  const packageJson = JSONUtilities.readJson<$TSAny>(packageJsonFilePath);
  return packageJson.version;
};

const addCore = async (pluginPlatform: PluginPlatform): Promise<void> => {
  const corePluginDirPath = getCorePluginDirPath();
  const pluginVerificationResult = await verifyPlugin(corePluginDirPath);
  if (pluginVerificationResult.verified) {
    const manifest = pluginVerificationResult.manifest as PluginManifest;
    const { name, version } = pluginVerificationResult.packageJson;
    const pluginInfo = new PluginInfo(name, version, corePluginDirPath, manifest);

    pluginPlatform.plugins[manifest.name] = [];
    pluginPlatform.plugins[manifest.name].push(pluginInfo);
  } else {
    throw new Error('The local Amplify-CLI is corrupted');
  }
};

/**
 * path resolution for various plugin directories
 */
export const normalizePluginDirectory = (directory: string): string => {
  switch (directory) {
    case constants.PackagedNodeModules:
      return path.join(__dirname, '..', '..', '..', '..');
    case constants.LocalNodeModules:
      return path.join(__dirname, '..', '..', 'node_modules');
    case constants.ParentDirectory:
      return path.join(__dirname, '..', '..', '..');
    case constants.GlobalNodeModules:
      return getGlobalNodeModuleDirPath();
    default:
      return directory;
  }
};

const isMatchingNamePattern = (pluginPrefixes: string[], pluginDirName: string): boolean => {
  if (pluginPrefixes && pluginPrefixes.length > 0) {
    return pluginPrefixes.some(prefix => {
      const regex = new RegExp(`^${prefix}`);
      return regex.test(pluginDirName);
    });
  }
  return true;
};

const verifyAndAdd = async (pluginPlatform: PluginPlatform, pluginDirPath: string): Promise<void> => {
  const pluginVerificationResult = await verifyPlugin(pluginDirPath);
  if (
    pluginVerificationResult.verified
    // Only the current core is added by the addCore(.) method, other packages can not be core
    && pluginVerificationResult.manifest!.name !== constants.CORE
  ) {
    const manifest = pluginVerificationResult.manifest as PluginManifest;
    const { name, version } = pluginVerificationResult.packageJson;
    const pluginInfo = new PluginInfo(name, version, pluginDirPath, manifest);

    let isPluginExcluded = false;
    if (pluginPlatform.excluded && pluginPlatform.excluded[manifest.name]) {
      isPluginExcluded = pluginPlatform.excluded[manifest.name].some(item => twoPluginsAreTheSame(item, pluginInfo));
    }

    if (!isPluginExcluded) {
      pluginPlatform.plugins[manifest.name] = pluginPlatform.plugins[manifest.name] || [];
      const pluginAlreadyAdded = pluginPlatform.plugins[manifest.name].some(item => twoPluginsAreTheSame(item, pluginInfo));

      if (!pluginAlreadyAdded) {
        pluginPlatform.plugins[manifest.name].push(pluginInfo);
      }
    }
  }
};

/**
 * return true if the passed in plugin has already been scanned, otherwise return false
 */
export const isUnderScanCoverageSync = (pluginPlatform: PluginPlatform, pluginDirPath: string): boolean => {
  let result = false;
  pluginDirPath = path.normalize(pluginDirPath);
  const pluginDirName = path.basename(pluginDirPath);

  if (fs.existsSync(pluginDirPath) && isMatchingNamePattern(pluginPlatform.pluginPrefixes, pluginDirName)) {
    result = pluginPlatform.pluginDirectories.some(directory => {
      directory = normalizePluginDirectory(directory);
      return fs.existsSync(directory) && isChildPath(pluginDirPath, directory);
    });
  }

  return result;
};

const addPluginPrefixWithMatchingPattern = async (
  subDirNames: string[],
  directory: string,
  pluginPlatform: PluginPlatform,
): Promise<void> => {
  if (subDirNames.length > 0) {
    const scanSubDirTasks = subDirNames.map(subDirName => async () => {
      if (isMatchingNamePattern(pluginPlatform.pluginPrefixes, subDirName)) {
        const pluginDirPath = path.join(directory, subDirName);
        await verifyAndAdd(pluginPlatform, pluginDirPath);
      }
    });
    await sequential(scanSubDirTasks);
  }
};
