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
  const officialPlugins: { [key: string]: PluginDescription } = getOfficialPlugins();
  const missingOfficialPlugins: Array<PluginDescription> = [];
  const mismatchedOfficialPlugins: Array<PluginDescription> = [];

  Object.keys(officialPlugins).forEach((plugin: string) => {
    const officialPluginDescription = officialPlugins[plugin];
    if (activePlugins[officialPluginDescription.name]) {
      let isPackageMatching = false;
      activePlugins[officialPluginDescription.name].every((pluginInfo: PluginInfo) => {
        if (isMatching(officialPluginDescription, pluginInfo)) {
          isPackageMatching = true;
          return false;
        }
        return true;
      });

      if (!isPackageMatching) {
        mismatchedOfficialPlugins.push(officialPluginDescription);
      }
    } else {
      missingOfficialPlugins.push(officialPluginDescription);
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
