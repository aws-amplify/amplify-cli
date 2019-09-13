import os from 'os';
import fs from 'fs-extra';
import path from 'path';
import Context from '../../domain/context';
import PluginInfo from '../../domain/plugin-info';
import constants from '../../domain/constants';
import {
    addUserPluginPackage,
    addExcludedPluginPackage as addFromExcluded,
    confirmAndScan,
} from '../../plugin-manager';
import inquirer, { InquirerOption, EXPAND } from '../../domain/inquirer-helper';
import { AddPluginError } from '../../domain/add-plugin-result';
import { normalizePluginDirectory } from '../../plugin-helpers/scan-plugin-platform';

const NEWPLUGINPACKAGE = 'A new plugin package';

export async function run(context: Context) {
  if (context.input.subCommands && context.input.subCommands.length > 1) {
    const input = context.input.subCommands[1];
    const { excluded } = context.pluginPlatform;
    if (excluded[input] && excluded[input].length > 0) {
      const { confirmed } = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmed',
        message: `Add from previously removed ${input} plugin`,
        default: true,
      });
      if (confirmed) {
        await addExcludedPluginPackage(context, excluded[input]);
      } else {
        await resolvePluginPathAndAdd(context, input);
      }
    } else {
      await resolvePluginPathAndAdd(context, input);
    }
  } else {
    await promptAndAdd(context);
  }
}

async function resolvePluginPathAndAdd(context: Context, inputPath: string) {
  const pluginDirPath = await resolvePluginPackagePath(context, inputPath);
  if (pluginDirPath) {
    addNewPluginPackage(context, pluginDirPath);
  } else {
    await promptAndAdd(context);
  }
}

async function resolvePluginPackagePath(context: Context, inputPath: string):
Promise<string | undefined> {
  if (fs.existsSync(inputPath)) {
    return inputPath;
  }{
    let result;

    const { pluginPlatform } = context;
    let searchDirPaths = [
      constants.ParentDirectory,
      constants.LocalNodeModules,
      constants.GlobalNodeModules,
    ];
    searchDirPaths = searchDirPaths.filter(dirPath =>
      !pluginPlatform.pluginDirectories.includes(dirPath.toString()));
    searchDirPaths = searchDirPaths.concat(pluginPlatform.pluginDirectories);

    const candicatePluginDirPaths = searchDirPaths.map(dirPath =>
      path.normalize(path.join(normalizePluginDirectory(dirPath), inputPath)),
    ).filter(pluginDirPath =>
      fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory(),
    );

    if (candicatePluginDirPaths.length === 1) {
      result = candicatePluginDirPaths[0];
    } else if (candicatePluginDirPaths.length > 1) {
      context.print.info('Multiple plugins with the package name are found')
      const options = candicatePluginDirPaths.concat(NEWPLUGINPACKAGE);
      const answer = await inquirer.prompt({
        type: 'list',
        name: 'selection',
        message: 'Select the plugin package to add',
        choices: options,
      });
      if (answer.selection === NEWPLUGINPACKAGE) {
        result = await promptForPluginPath();
      } else {
        result = answer.selection;
      }
    }

    return result;
  }
}


async function promptAndAdd(context: Context) {
  const options = new Array<InquirerOption>();
  const { excluded } = context.pluginPlatform;
  if (excluded && Object.keys(excluded).length > 0) {
    Object.keys(excluded).forEach((key) => {
      if (excluded[key].length > 0) {
        const option = {
          name: key + EXPAND,
          value: excluded[key],
          short: key + EXPAND,
        };
        if (excluded[key].length === 1) {
          const pluginInfo = excluded[key][0];
          option.name = pluginInfo.packageName + '@' + pluginInfo.packageVersion;
          option.short = pluginInfo.packageName + '@' + pluginInfo.packageVersion;
        }
        options.push(option);
      }
    })
  }

  if (options.length > 0) {
    options.unshift({
      name: NEWPLUGINPACKAGE,
      value: NEWPLUGINPACKAGE,
      short: NEWPLUGINPACKAGE,
    });
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'selection',
      message: 'Select the plugin package to add',
      choices: options,
    });
    if (answer.selection === NEWPLUGINPACKAGE) {
      const pluginDirPath = await promptForPluginPath();
      await addNewPluginPackage(context, pluginDirPath);
    } else {
      await addExcludedPluginPackage(context, answer.selection);
    }
  } else {
    const pluginDirPath = await promptForPluginPath();
    await addNewPluginPackage(context, pluginDirPath);
  }
}


async function promptForPluginPath(): Promise<string> {
  const answer = await inquirer.prompt({
    type: 'input',
    name: 'pluginDirPath',
    message: `Enter the absolute path for the root of the plugin directory: ${os.EOL}`,
    transformer: (pluginDirPath: string) => pluginDirPath.trim(),
    validate: (pluginDirPath: string) => {
      pluginDirPath = pluginDirPath.trim();
      if (fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory()) {
        return true;
      }
      return 'The plugin package directory path you entered does NOT exist';
    },
  });
  return answer.pluginDirPath;
}

async function addNewPluginPackage(context: Context, pluginDirPath: string) {
  try {
    const addUserPluginResult = addUserPluginPackage(
      context.pluginPlatform,
      pluginDirPath.trim(),
    );
    if (addUserPluginResult.isAdded) {
      context.print.success('Successfully added plugin package.');
      await confirmAndScan(context.pluginPlatform);
    } else {
      context.print.error('Failed to add the plugin package.');
      context.print.info(`Error code: ${addUserPluginResult.error}`);
      if (addUserPluginResult.error === AddPluginError.FailedVerification &&
                addUserPluginResult.pluginVerificationResult &&
                addUserPluginResult.pluginVerificationResult.error) {
        context.print.info(
          `Plugin verification error code: ${addUserPluginResult.pluginVerificationResult.error}`,
        );
      }
    }
  } catch (e) {
    context.print.error('Failed to add the plugin package.');
    context.print.info(e);
  }
}

async function addExcludedPluginPackage(context: Context, userSelection: PluginInfo[]) {
  if (userSelection.length > 0) {
    if (userSelection.length === 1) {
      addFromExcluded(context.pluginPlatform, userSelection[0]);
    } else {
      const options = new Array<InquirerOption>();
      userSelection.forEach((pluginInfo) => {
        options.push({
          name: pluginInfo.packageName + '@' + pluginInfo.packageVersion,
          value: pluginInfo,
          short: pluginInfo.packageName + '@' + pluginInfo.packageVersion,
        })
      });

      const answer = await inquirer.prompt({
        type: 'list',
        name: 'selection',
        message: 'Select the plugin package to add',
        choices: options,
      });

      addFromExcluded(context.pluginPlatform, answer.selection);
    }
    await confirmAndScan(context.pluginPlatform);
  }
}