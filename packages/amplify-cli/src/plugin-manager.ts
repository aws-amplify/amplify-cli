import { PluginPlatform } from './domain/plugin-platform';
import { PluginInfo } from './domain/plugin-info';
import { readPluginsJsonFileSync, writePluginsJsonFileSync } from './plugin-helpers/access-plugins-file';
import {
  scanPluginPlatform,
  getCorePluginDirPath,
  getCorePluginVersion,
  isUnderScanCoverageSync,
} from './plugin-helpers/scan-plugin-platform';
import { verifyPlugin, verifyPluginSync } from './plugin-helpers/verify-plugin';
import createNewPlugin from './plugin-helpers/create-new-plugin';
import { AddPluginResult, AddPluginError } from './domain/add-plugin-result';
import { twoPluginsAreTheSame } from './plugin-helpers/compare-plugins';
import { AmplifyEvent } from './domain/amplify-event';
import inquirer from './domain/inquirer-helper';
import { constants } from './domain/constants';
import { print } from './context-extensions';

export async function getPluginPlatform(): Promise<PluginPlatform> {
  // This function is called at the beginning of each command execution
  // and performs the following actions:
  // 1. read the plugins.json file
  // 2. checks the last scan time stamp,
  // 3. re-scan if needed.
  // 4. write to update the plugins.json file if re-scan is performed
  // 5. return the pluginsInfo object
  let pluginPlatform = readPluginsJsonFileSync();
  if (pluginPlatform) {
    if (isCoreMatching(pluginPlatform)) {
      const lastScanTime = new Date(pluginPlatform.lastScanTime);
      const currentTime = new Date();
      // tslint:disable-next-line
      const timeDiffInSeconds = (currentTime.getTime() - lastScanTime.getTime()) / 1000;
      if (timeDiffInSeconds > pluginPlatform.maxScanIntervalInSeconds) {
        pluginPlatform = await scan();
      }
    } else {
      pluginPlatform = await scan();
    }
  } else {
    pluginPlatform = await scan();
  }

  return pluginPlatform;
}

function isCoreMatching(pluginPlatform: PluginPlatform): boolean {
  try {
    const currentCorePluginDirPath = getCorePluginDirPath();
    const currentCorePluginVersion = getCorePluginVersion();
    const platformCorePluginDirPath = pluginPlatform.plugins[constants.CORE][0].packageLocation;
    const platformCorePluginVersion = pluginPlatform.plugins[constants.CORE][0].packageVersion;
    return currentCorePluginDirPath === platformCorePluginDirPath && currentCorePluginVersion === platformCorePluginVersion;
  } catch {
    return false;
  }
}

export function getPluginsWithName(pluginPlatform: PluginPlatform, nameOrAlias: string): Array<PluginInfo> {
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
}

export function getPluginsWithNameAndCommand(pluginPlatform: PluginPlatform, nameOrAlias: string, command: string): Array<PluginInfo> {
  const result = new Array<PluginInfo>();

  Object.keys(pluginPlatform.plugins).forEach(pluginName => {
    pluginPlatform.plugins[pluginName].forEach(pluginInfo => {
      const { name, aliases, commands, commandAliases } = pluginInfo.manifest;
      const nameOrAliasMatching = name === nameOrAlias || (aliases && aliases!.includes(nameOrAlias));

      if (nameOrAliasMatching) {
        if ((commands && commands.includes(command)) || (commandAliases && Object.keys(commandAliases).includes(command))) {
          result.push(pluginInfo);
        }
      }
    });
  });

  return result;
}

export function getPluginsWithEventHandler(pluginPlatform: PluginPlatform, event: AmplifyEvent): Array<PluginInfo> {
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
}

export function getAllPluginNames(pluginPlatform: PluginPlatform): Set<string> {
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
}

export async function scan(pluginPlatform?: PluginPlatform): Promise<PluginPlatform> {
  print.info('Scanning for plugins...');
  try {
    const result = await scanPluginPlatform(pluginPlatform);
    print.info('Plugin scan successful');
    return result;
  } catch (e) {
    print.error('Plugin scan failed.');
    throw new Error('Plugin scan failed.');
  }
}

export { verifyPlugin };

export { createNewPlugin };

export async function confirmAndScan(pluginPlatform: PluginPlatform) {
  const { confirmed } = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmed',
    message: 'Run a fresh scan for plugins on the Amplify CLI pluggable platform',
    default: false,
  });
  if (confirmed) {
    await scan(pluginPlatform);
  }
}

export function addUserPluginPackage(pluginPlatform: PluginPlatform, pluginDirPath: string): AddPluginResult {
  return addPluginPackage(pluginPlatform, pluginDirPath);
}

export function addExcludedPluginPackage(pluginPlatform: PluginPlatform, pluginInfo: PluginInfo): AddPluginResult {
  return addPluginPackage(pluginPlatform, pluginInfo.packageLocation);
}

export function addPluginPackage(pluginPlatform: PluginPlatform, pluginDirPath: string): AddPluginResult {
  const pluginVerificationResult = verifyPluginSync(pluginDirPath);
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
    writePluginsJsonFileSync(pluginPlatform);
    result.isAdded = true;
  } else {
    result.error = AddPluginError.FailedVerification;
  }
  return result;
}

// remove: select from the plugins only,
// if the location belongs to the scan directories, put the info inside the excluded.
// if the location is in the useraddedlocaitons, remove it from the user added locations.
export function removePluginPackage(pluginPlatform: PluginPlatform, pluginInfo: PluginInfo): void {
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
  writePluginsJsonFileSync(pluginPlatform);
}
