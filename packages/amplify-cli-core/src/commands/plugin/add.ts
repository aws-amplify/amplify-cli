import Context from '../../domain/context';
import os from 'os';
import fs from 'fs-extra';
import { addUserPluginPackage } from '../../plugin-manager';
const inquirer = require('inquirer');

const NEWPLUGINPACKAGE = 'A new plugin package';
const EXPAND = ' >';

export default async function add(context: Context) {

    const options = new Array<string>();
    const { excluded } =  context.pluginPlatform;
    if (excluded && Object.keys(excluded).length > 0) {
        Object.keys(excluded).forEach(key => {
            if (excluded[key].length === 1) {
                const plugin = excluded[key][0];
                options.push( plugin.packageName + '@' + plugin.packageVersion );
            } else if (excluded[key].length > 1) {
                options.push( key + EXPAND );
            }
        })
    }

    if (options.length > 0) {
        options.unshift(NEWPLUGINPACKAGE);
        const answer = await inquirer.prompt({
            type: 'list',
            name: 'section',
            message: 'Select the plugin package to add',
            choices: options
        });
        if (answer.selection === NEWPLUGINPACKAGE) {
            await addNewPluginPackage(context);
        } else {
            await addExcludedPackage(context, answer.selection);
        }
    } else {
        await addNewPluginPackage(context);
    }
}


async function addNewPluginPackage(context: Context) {
    const answer = await inquirer.prompt({
        type: 'input',
        name: 'pluginDirPath',
        message: `Enter the full path of the plugin package: ${os.EOL}`,
        validate: (pluginDirPath: string) => {
            if (fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory()) {
                return true;
            }
            return "The plugin package directory path you entered does NOT exist";
        }
    });

    try {
        const addUserPluginResult = addUserPluginPackage(context.pluginPlatform, answer.pluginDirPath);
        if (addUserPluginResult.isAdded) {
            context.print.success('Successfully added plugin package.');
        } else {
            context.print.error(addUserPluginResult.error);
        }
    } catch (e) {
        context.print.error('Failed to add the plugin package.')
        context.print.info(e);
    }
}

async function addExcludedPackage(context: Context, selection: string) {
    console.log('addExcludedPackage to be implemented')
}