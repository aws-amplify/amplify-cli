import * as inquirer from 'inquirer';
import { Context } from '../../domain/context';
import { removePluginPackage, confirmAndScan } from '../../plugin-manager';
import { PluginPlatform, constants, PluginInfo } from 'amplify-cli-core';
import { InquirerOption, EXPAND } from '../../domain/inquirer-helper';

export const run = async (context: Context) => {
  const options = new Array<InquirerOption>();
  const { plugins } = context.pluginPlatform;

  if (plugins && Object.keys(plugins).length > 0) {
    Object.keys(plugins).forEach(key => {
      if (key === constants.CORE) {
        return;
      }

      if (plugins[key].length > 0) {
        const option = {
          name: key + EXPAND,
          value: plugins[key],
          short: key + EXPAND,
        };
        if (plugins[key].length === 1) {
          const pluginInfo = plugins[key][0];
          option.name = pluginInfo.packageName + '@' + pluginInfo.packageVersion;
          option.short = pluginInfo.packageName + '@' + pluginInfo.packageVersion;
        }
        options.push(option);
      }
    });
  }

  if (options.length > 0) {
    const { selections } = await inquirer.prompt({
      type: 'checkbox',
      name: 'selections',
      message: 'Select the plugin packages to remove',
      choices: options,
    });

    if (selections.length > 0) {
      const sequential = require('promise-sequential');
      const removeTasks = selections.map((selection: Array<PluginInfo>) => async () => {
        await removeNamedPlugins(context.pluginPlatform, selection);
      });
      await sequential(removeTasks);
      await confirmAndScan(context.pluginPlatform);
    }
  } else {
    context.print.console.error('No plugins are found');
  }
};

async function removeNamedPlugins(pluginPlatform: PluginPlatform, pluginInfo: Array<PluginInfo>) {
  if (pluginInfo.length === 1) {
    removePluginPackage(pluginPlatform, pluginInfo[0]);
  } else if (pluginInfo.length > 1) {
    const options = pluginInfo.map((singlePluginInfo: PluginInfo) => {
      const optionObject = {
        name: singlePluginInfo.packageName + '@' + singlePluginInfo.packageVersion,
        value: singlePluginInfo,
        short: singlePluginInfo.packageName + '@' + singlePluginInfo.packageVersion,
      };
      return optionObject;
    });
    const { selections } = await inquirer.prompt({
      type: 'checkbox',
      name: 'selections',
      message: 'Select the plugin packages to remove',
      choices: options,
    });

    if (selections.length > 0) {
      const sequential = require('promise-sequential');
      const removeTasks = selections.map((singlePluginInfo: PluginInfo) => async () => {
        await removePluginPackage(pluginPlatform, singlePluginInfo);
      });
      await sequential(removeTasks);
    }
  }
}
