import Context from './domain/context';
import {getPluginsWithNameAndCommand} from './plugin-manager';
import PluginInfo from './domain/plugin-info';

const inquirer = require('inquirer');

export async function executeCommand(context: Context) {
    const pluginCandidates = getPluginsWithNameAndCommand(context.pluginPlatform,
                                        context.input.plugin!, context.input.command!);

    if (pluginCandidates.length === 1) {
        await executePluginModuleCommand(context, pluginCandidates[0]);
    } else {
        const answer = await inquirer.prompt({
            type: 'list',
            name: 'section',
            message: 'Select the module to execute',
            choices: pluginCandidates.map((plugin) => {
                return {
                    name: plugin.packageName + '@' + plugin.packageVersion,
                    value: plugin,
                    short: plugin.packageName
                };
            })
        });
        const pluginModule =  answer.section as PluginInfo;
        await await executePluginModuleCommand(context, pluginModule);
    }
}

async function executePluginModuleCommand(context: Context, plugin: PluginInfo) {
    const { commands, commandAliases } = plugin.manifest;
    if (!commands!.includes(context.input.command!)) {
        context.input.command = commandAliases![context.input.command!];
    }
    const pluginModule = require(plugin.packageLocation);
    await pluginModule.executeAmplifyCommand(context);
}