import { Context } from '../../domain/context';
import { removePluginPackage, confirmAndScan } from '../../plugin-manager';
import { PluginPlatform } from '../../domain/plugin-platform';
import { constants } from '../../domain/constants';
import inquirer, { InquirerOption, EXPAND } from '../../domain/inquirer-helper';
import { PluginInfo } from '../../domain/plugin-info';

export async function run(context: Context) {
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
}

async function removeNamedPlugins(pluginPlatform: PluginPlatform, pluginInfos: Array<PluginInfo>) {
  if (pluginInfos.length === 1) {
    removePluginPackage(pluginPlatform, pluginInfos[0]);
  } else if (pluginInfos.length > 1) {
    const options = pluginInfos.map((pluginInfo: PluginInfo) => {
      const optionObject = {
        name: pluginInfo.packageName + '@' + pluginInfo.packageVersion,
        value: pluginInfo,
        short: pluginInfo.packageName + '@' + pluginInfo.packageVersion,
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
      const removeTasks = selections.map((pluginInfo: PluginInfo) => async () => {
        await removePluginPackage(pluginPlatform, pluginInfo);
      });
      await sequential(removeTasks);
    }
  }
}
