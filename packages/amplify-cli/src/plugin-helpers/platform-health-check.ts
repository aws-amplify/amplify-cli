/* eslint-disable jsdoc/require-description */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as path from 'path';
import chalk from 'chalk';
import { JSONUtilities, $TSAny, PluginInfo, PluginPlatform } from 'amplify-cli-core';
import { satisfies } from 'semver';

/**
 *
 */
export type PluginDescription = {
  name: string;
  type: string;
  packageName: string;
  packageVersion?: string;
};

const indent = '    ';

/**
 *
 */
export async function checkPlatformHealth(pluginPlatform: PluginPlatform): Promise<boolean> {
  const activePlugins = pluginPlatform.plugins;
  const officialPlugins = getOfficialPlugins();
  const missingOfficialPlugins: Array<PluginDescription> = [];
  const mismatchedOfficialPlugins: Array<PluginDescription> = [];

  Object.keys(officialPlugins).forEach((pluginName: string) => {
    let officialArray: Array<PluginDescription> = [];
    if (!Array.isArray(officialPlugins[pluginName])) {
      officialArray.push(officialPlugins[pluginName] as PluginDescription);
    } else {
      officialArray = officialPlugins[pluginName] as Array<PluginDescription>;
    }

    if (activePlugins[pluginName]) {
      const activeArray = activePlugins[pluginName];

      officialArray.forEach((officialPlugin: PluginDescription) => {
        let matchLevel = 0; // 0: missing, 1: found package but failed matching test, 2 found matching package
        for (let i = 0; i < activeArray.length; i++) {
          const activePlugin = activeArray[i];
          if (activePlugin.packageName === officialPlugin.packageName) {
            if (isMatching(officialPlugin, activePlugin)) {
              matchLevel = 2;
              break;
            } else {
              matchLevel = 1;
            }
          }
        }
        if (matchLevel === 0) {
          missingOfficialPlugins.push(officialPlugin);
        }
        if (matchLevel === 1) {
          mismatchedOfficialPlugins.push(officialPlugin);
        }
      });
    } else {
      missingOfficialPlugins.push(...officialArray);
    }
  });

  if (missingOfficialPlugins.length > 0) {
    console.log(chalk.yellow('The following official plugins are missing or inactive:'));
    missingOfficialPlugins.forEach((pluginDescription: PluginDescription) => {
      const { name, type, packageName, packageVersion } = pluginDescription;
      console.log(`${indent}${name}: ${type} | ${packageName}@${packageVersion}`);
    });
  }

  if (mismatchedOfficialPlugins.length > 0) {
    console.log(chalk.yellow('The following official plugins have mismatched packages:'));
    mismatchedOfficialPlugins.forEach((pluginDescription: PluginDescription) => {
      const { name, type, packageName, packageVersion } = pluginDescription;
      console.log('Expected:');
      console.log(`${indent}${name}: ${type} | ${packageName}@${packageVersion}`);
      console.log('Found:');
      activePlugins[name].every((pluginInfo: PluginInfo) => {
        const { manifest } = pluginInfo;
        console.log(`${indent}${manifest.name}: ${manifest.type} | ${pluginInfo.packageName}@${pluginInfo.packageVersion}`);
      });
    });
  }

  return missingOfficialPlugins.length === 0 && mismatchedOfficialPlugins.length === 0;
}

function isMatching(pluginDescription: PluginDescription, pluginInfo: PluginInfo) {
  let result = pluginDescription.packageName === pluginInfo.packageName && pluginDescription.type === pluginInfo.manifest.type;

  if (result && pluginDescription.packageVersion) {
    result = satisfies(pluginInfo.packageVersion, pluginDescription.packageVersion);
  }

  return result;
}

/**
 *
 */
export function getOfficialPlugins(): { [key: string]: PluginDescription | Array<PluginDescription> } {
  const packageJsonFilePath = path.normalize(path.join(__dirname, '..', '..', 'package.json'));
  const packageJson = JSONUtilities.readJson<$TSAny>(packageJsonFilePath);
  const { officialPlugins } = packageJson.amplify;

  const { dependencies } = packageJson;

  Object.keys(officialPlugins).forEach((plugin: string) => {
    const plugins = Array.isArray(officialPlugins[plugin]) ? officialPlugins[plugin] : [officialPlugins[plugin]];
    plugins.forEach(officialPlugin => {
      const { packageName } = officialPlugin;
      if (dependencies[packageName]) {
        const version = dependencies[packageName];
        officialPlugin.packageVersion = version;
      } else {
        delete officialPlugin.packageVersion;
      }
    });
  });

  const coreVersion = packageJson.version;
  officialPlugins.core.packageVersion = coreVersion;

  return officialPlugins;
}
