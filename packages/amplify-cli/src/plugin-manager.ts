import { printer, prompter } from 'amplify-prompts';
import { AddPluginError, AddPluginResult } from './domain/add-plugin-result';
import { AmplifyEvent } from './domain/amplify-event';
import { constants } from './domain/constants';
import { PluginInfo } from './domain/plugin-info';
import { PluginPlatform } from './domain/plugin-platform';
import { readPluginsJsonFile, writePluginsJsonFile } from './plugin-helpers/access-plugins-file';
import { twoPluginsAreTheSame } from './plugin-helpers/compare-plugins';
import createNewPlugin from './plugin-helpers/create-new-plugin';
import {
  getCorePluginDirPath,
  getCorePluginVersion,
  isUnderScanCoverageSync,
  scanPluginPlatform,
} from './plugin-helpers/scan-plugin-platform';
import { verifyPlugin } from './plugin-helpers/verify-plugin';
import { postInstallInitialization } from './utils/post-install-initialization';

export { verifyPlugin };
export { createNewPlugin };

/**
 * This function is called at the beginning of each command execution
 * and performs the following actions:
 * 1. read the plugins.json file
 * 2. checks the last scan time stamp,
 * 3. re-scan if needed.
 * 4. write to update the plugins.json file if re-scan is performed
 * 5. return the pluginsInfo object
 */
export const getPluginPlatform = async (): Promise<PluginPlatform> => {
  let pluginPlatform = readPluginsJsonFile();

  if (pluginPlatform) {
    if (isCoreMatching(pluginPlatform)) {
      const lastScanTime = new Date(pluginPlatform.lastScanTime);
      const currentTime = new Date();
      const timeDiffInSeconds = (currentTime.getTime() - lastScanTime.getTime()) / 1000;
      if (timeDiffInSeconds > pluginPlatform.maxScanIntervalInSeconds) {
        pluginPlatform = await scan();
      }
    } else {
      // new CLI version detected
      await postInstallInitialization();
      pluginPlatform = await scan();
    }
  } else {
    // first CLI install detected
    await postInstallInitialization();
    pluginPlatform = await scan();
  }

  return pluginPlatform;
};

const isCoreMatching = (pluginPlatform: PluginPlatform): boolean => {
  try {
    const currentCorePluginDirPath = getCorePluginDirPath();
    const currentCorePluginVersion = getCorePluginVersion();
    const platformCorePluginDirPath = pluginPlatform.plugins[constants.CORE][0].packageLocation;
    const platformCorePluginVersion = pluginPlatform.plugins[constants.CORE][0].packageVersion;
    return currentCorePluginDirPath === platformCorePluginDirPath && currentCorePluginVersion === platformCorePluginVersion;
  } catch {
    return false;
  }
};

/**
 * get plugins by name
 */
export const getPluginsWithName = (pluginPlatform: PluginPlatform, nameOrAlias: string): Array<PluginInfo> => {
  let result = new Array<PluginInfo>();

  Object.keys(pluginPlatform.plugins).forEach(pluginName => {
    if (pluginName === nameOrAlias) {
      result = result.concat(pluginPlatform.plugins[pluginName]);
    } else {
      pluginPlatform.plugins[pluginName].forEach(pluginInfo => {
        if (pluginInfo.manifest.aliases && pluginInfo.manifest.aliases!.includes(nameOrAlias)) {
          result.push(pluginInfo);
        }
      });
    }
  });

  return result;
};

/**
 * get plugins by name and command
 */
export const getPluginsWithNameAndCommand = (pluginPlatform: PluginPlatform, nameOrAlias: string, command: string): Array<PluginInfo> => {
  const result = new Array<PluginInfo>();

  Object.keys(pluginPlatform.plugins).forEach(pluginName => {
    pluginPlatform.plugins[pluginName].forEach(pluginInfo => {
      const {
        name, aliases, commands, commandAliases,
      } = pluginInfo.manifest;
      const nameOrAliasMatching = name === nameOrAlias || (aliases && aliases!.includes(nameOrAlias));

      if (nameOrAliasMatching) {
        if ((commands && commands.includes(command)) || (commandAliases && Object.keys(commandAliases).includes(command))) {
          result.push(pluginInfo);
        }
      }
    });
  });

  return result;
};

/**
 * get plugins that support handling a passed in event
 */
export const getPluginsWithEventHandler = (pluginPlatform: PluginPlatform, event: AmplifyEvent): Array<PluginInfo> => {
  const result = new Array<PluginInfo>();

  Object.keys(pluginPlatform.plugins).forEach(pluginName => {
    pluginPlatform.plugins[pluginName].forEach(pluginInfo => {
      const { eventHandlers } = pluginInfo.manifest;
      if (eventHandlers && eventHandlers.length > 0 && eventHandlers.includes(event)) {
        result.push(pluginInfo);
      }
    });
  });

  return result;
};

/**
 * get the names of all plugins as a set
 */
export const getAllPluginNames = (pluginPlatform: PluginPlatform): Set<string> => {
  const result = new Set<string>();

  Object.keys(pluginPlatform.plugins).forEach(pluginName => {
    result.add(pluginName);

    pluginPlatform.plugins[pluginName].forEach(pluginInfo => {
      if (pluginInfo.manifest.aliases && pluginInfo.manifest.aliases.length > 0) {
        pluginInfo.manifest.aliases.forEach(alias => {
          result.add(alias);
        });
      }
    });
  });

  return result;
};

/**
 * wrapper around scanPluginPlatform
 */
export const scan = async (pluginPlatform?: PluginPlatform): Promise<PluginPlatform> => {
  try {
    return scanPluginPlatform(pluginPlatform);
  } catch (e) {
    printer.error('Plugin scan failed.');
    printer.info(e);
    throw new Error('Plugin scan failed.');
  }
};

/**
 * Ask to scan
 */
export const confirmAndScan = async (pluginPlatform: PluginPlatform): Promise<void> => {
  const confirmed = await prompter.confirmContinue('Run a fresh scan for plugins on the Amplify CLI pluggable platform?');
  if (confirmed) {
    await scan(pluginPlatform);
  }
};

/**
 * add user plugin
 */
export const addUserPluginPackage = async (
  pluginPlatform: PluginPlatform,
  pluginDirPath: string,
): Promise<AddPluginResult> => addPluginPackage(pluginPlatform, pluginDirPath);

/**
 * add excluded plugin
 */
export const addExcludedPluginPackage = async (
  pluginPlatform: PluginPlatform,
  pluginInfo: PluginInfo,
): Promise<AddPluginResult> => addPluginPackage(pluginPlatform, pluginInfo.packageLocation);

/* eslint-disable no-param-reassign */

/**
 * add a plugin
 */
export const addPluginPackage = async (pluginPlatform: PluginPlatform, pluginDirPath: string): Promise<AddPluginResult> => {
  const pluginVerificationResult = await verifyPlugin(pluginDirPath);
  const result = new AddPluginResult(false, pluginVerificationResult);

  if (pluginVerificationResult.verified) {
    const { packageJson, manifest } = pluginVerificationResult;
    const pluginInfo = new PluginInfo(packageJson.name, packageJson.version, pluginDirPath, manifest!);

    // take the package out of the excluded
    if (pluginPlatform.excluded[pluginInfo.manifest.name] && pluginPlatform.excluded[pluginInfo.manifest.name].length > 0) {
      const updatedExcluded = new Array<PluginInfo>();
      pluginPlatform.excluded[pluginInfo.manifest.name].forEach(pluginInfoItem => {
        if (!twoPluginsAreTheSame(pluginInfoItem, pluginInfo)) {
          updatedExcluded.push(pluginInfoItem);
        }
      });
      if (updatedExcluded.length > 0) {
        pluginPlatform.excluded[pluginInfo.manifest.name] = updatedExcluded;
      } else {
        delete pluginPlatform.excluded[pluginInfo.manifest.name];
      }
    }

    // insert into the plugins
    const updatedPlugins = new Array<PluginInfo>();
    if (pluginPlatform.plugins[pluginInfo.manifest.name] && pluginPlatform.plugins[pluginInfo.manifest.name].length > 0) {
      pluginPlatform.plugins[pluginInfo.manifest.name].forEach(pluginInfoItem => {
        if (!twoPluginsAreTheSame(pluginInfoItem, pluginInfo)) {
          updatedPlugins.push(pluginInfoItem);
        }
      });
    }
    updatedPlugins.push(pluginInfo);
    pluginPlatform.plugins[pluginInfo.manifest.name] = updatedPlugins;

    // insert into the userAddedLocations if it's not under scan coverage
    if (!isUnderScanCoverageSync(pluginPlatform, pluginDirPath) && !pluginPlatform.userAddedLocations.includes(pluginDirPath)) {
      pluginPlatform.userAddedLocations.push(pluginDirPath);
    }

    // write the plugins.json file
    writePluginsJsonFile(pluginPlatform);

    result.isAdded = true;
  } else {
    result.error = AddPluginError.FailedVerification;
  }
  return result;
};

/**
 * only remove from the plugins:
 *   if the location belongs to the scan directories, put the info inside the excluded
 *   if the location is in the userAddedLocations, remove it from the user added locations
 */
export const removePluginPackage = (pluginPlatform: PluginPlatform, pluginInfo: PluginInfo): void => {
  // remove from the plugins
  if (pluginPlatform.plugins[pluginInfo.manifest.name] && pluginPlatform.plugins[pluginInfo.manifest.name].length > 0) {
    const updatedPlugins = new Array<PluginInfo>();
    pluginPlatform.plugins[pluginInfo.manifest.name].forEach(pluginInfoItem => {
      if (!twoPluginsAreTheSame(pluginInfoItem, pluginInfo)) {
        updatedPlugins.push(pluginInfoItem);
      }
    });
    if (updatedPlugins.length > 0) {
      pluginPlatform.plugins[pluginInfo.manifest.name] = updatedPlugins;
    } else {
      delete pluginPlatform.plugins[pluginInfo.manifest.name];
    }
  }

  // remove from the userAddedLocations
  if (pluginPlatform.userAddedLocations.includes(pluginInfo.packageLocation)) {
    const updatedUserAddedLocations = new Array<string>();
    pluginPlatform.userAddedLocations.forEach(packageLocation => {
      if (packageLocation !== pluginInfo.packageLocation) {
        updatedUserAddedLocations.push(packageLocation);
      }
    });
    pluginPlatform.userAddedLocations = updatedUserAddedLocations;
  }

  // if the plugin is under scan coverage, insert into the excluded
  if (isUnderScanCoverageSync(pluginPlatform, pluginInfo.packageLocation)) {
    pluginPlatform.excluded[pluginInfo.manifest.name] = pluginPlatform.excluded[pluginInfo.manifest.name] || [];
    pluginPlatform.excluded[pluginInfo.manifest.name].push(pluginInfo);
  }

  writePluginsJsonFile(pluginPlatform);
};

/* eslint-enable no-param-reassign */
