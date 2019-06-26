import util from 'util';
import path from 'path';
import constants from './domain/constants';
import Context from './domain/context';
import PluginInfo from './domain/plugin-info';

const inquirer = require('inquirer');

export async function executeCommand(context: Context) {
    if (context.input.plugin) {
        await executePluginCommand(context, context.plugins[context.input.plugin]);
    } else {
        await executePluginCommand(context, context.plugins[constants.CORE]);
    }
}

async function executePluginCommand(context: Context, plugins: Array<PluginInfo>) {
    const filteredPlugins = plugins.filter(plugin => {
        return plugin.manifest.commands.includes(<string>context.input.command)
    });

    if (filteredPlugins.length === 1) {
        const pluginModule = require(filteredPlugins[0].packageLocation);
        await pluginModule.executeAmplifyCommand(context);
    } else {
        const answer = await inquirer.prompt({
            type: 'list',
            name: 'section',
            message: 'Select the module to execute',
            choices: filteredPlugins.map((plugin) => {
                return {
                    name: plugin.packageName + '@' + plugin.packageVersion,
                    value: plugin.packageLocation,
                    short: plugin.packageName
                };
            })
        });
        const pluginModule = require(answer.section);
        await pluginModule.executeAmplifyCommand(context);
    }
}