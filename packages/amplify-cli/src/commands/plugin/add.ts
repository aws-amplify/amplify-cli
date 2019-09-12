import Context from '../../domain/context';
import os from 'os';
import fs from 'fs-extra';
import PluginInfo from '../../domain/plugin-info';
import {
    addUserPluginPackage,
    addExcludedPluginPackage as addFromExcluded,
    confirmAndScan,
} from '../../plugin-manager';
import inquirer, { InquirerOption, EXPAND } from '../../domain/inquirer-helper';
import { AddPluginError } from '../../domain/add-plugin-result';

const NEWPLUGINPACKAGE = 'A new plugin package';


export async function run(context: Context) {
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
      await addNewPluginPackage(context);
    } else {
      await addExcludedPluginPackage(context, answer.selection);
    }
  } else {
    await addNewPluginPackage(context);
  }
}


async function addNewPluginPackage(context: Context) {
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

  try {
    const addUserPluginResult = addUserPluginPackage(
      context.pluginPlatform,
      answer.pluginDirPath.trim(),
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