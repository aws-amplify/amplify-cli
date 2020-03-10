import path from 'path';
import chalk from 'chalk';
import { PluginInfo } from '../domain/plugin-info';
import { PluginPlatform } from '../domain/plugin-platform';
import { readJsonFileSync } from '../utils/readJsonFile';

export type PluginDescription = {
  name: string;
  type: string;
  packageName: string;
  packageVersion?: string;
};

const indent = '    ';

export async function checkPlatformHealth(pluginPlatform: PluginPlatform): Promise<boolean> {
  const activePlugins = pluginPlatform.plugins;
  const officialPlugins: { [key: string]: PluginDescription | Array<PluginDescription> } = getOfficialPlugins();
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
        let matchLevel = 0; //0: missing, 1: found package but failed matching test, 2 found matching package
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
    result = pluginDescription.packageVersion === pluginInfo.packageVersion;
  }

  return result;
}

export function getOfficialPlugins() {
  const packageJsonFilePath = path.normalize(path.join(__dirname, '../../package.json'));
  const packageJson = readJsonFileSync(packageJsonFilePath);
  const { officialPlugins } = packageJson.amplify;

  const dependencies: { [key: string]: string } = packageJson.dependencies;

  Object.keys(officialPlugins).forEach((plugin: string) => {
    const { packageName } = officialPlugins[plugin];
    if (dependencies[packageName]) {
      const version = dependencies[packageName];
      officialPlugins[plugin].packageVersion = version;
    } else {
      delete officialPlugins[plugin].packageVersion;
    }
  });

  const coreVersion = packageJson.version;
  officialPlugins.core.packageVersion = coreVersion;

  return officialPlugins;
}
