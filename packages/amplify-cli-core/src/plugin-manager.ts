import PluginPlatform from './domain/plugin-platform';
import PluginInfo from './domain/plugin-info';
import {readPluginsJsonFile } from './plugin-helpers/access-plugins-file';
import scanPluginPlatform from './plugin-helpers/scan-plugin-platform';
import AddUserPluginResult from './domain/add-user-plugin-result';

export function getPluginPlatform(): PluginPlatform {
    //This function is called at the beginning of each command execution
    //and performs the following actions:
    //1. read the plugins.json file
    //2. checks the last scan time stamp,
    //3. re-scan if needed.
    //4. write to update the plugins.json file if re-scan is performed
    //5. return the pluginsInfo object
    let pluginPlatform = readPluginsJsonFile();
    if (pluginPlatform) {
        const lastScanTime = new Date(pluginPlatform.lastScanTime);
        const currentTime = new Date();
        const timeDiffInSeconds = (currentTime.getTime() - lastScanTime.getTime()) / 1000;
        if (timeDiffInSeconds > pluginPlatform.maxScanIntervalInSeconds) {
            pluginPlatform = scanPluginPlatform();
        }
    } else {
        pluginPlatform = scanPluginPlatform();
    }

    return pluginPlatform;
}

export function getPluginsWithName(
    pluginPlatform: PluginPlatform,
    nameOrAlias: string
): Array<PluginInfo> {
    let result = new Array<PluginInfo>();

    Object.keys(pluginPlatform.plugins).forEach((pluginName) => {
        if (pluginName === nameOrAlias) {
            result = result.concat(pluginPlatform.plugins[pluginName]);
        } else {
            pluginPlatform.plugins[pluginName].forEach((pluginInfo) => {
                if (pluginInfo.manifest.aliases &&
                        pluginInfo.manifest.aliases!.includes(nameOrAlias)) {
                    result.push(pluginInfo);
                }
            })
        }
    });

    return result;
}

export function getPluginsWithNameAndCommand(
    pluginPlatform: PluginPlatform,
    nameOrAlias: string,
    command: string
): Array<PluginInfo> {
    let result = new Array<PluginInfo>();

    Object.keys(pluginPlatform.plugins).forEach((pluginName) => {
        pluginPlatform.plugins[pluginName].forEach((pluginInfo) => {
            const {name, aliases, commands, commandAliases} = pluginInfo.manifest;
            const nameOrAliasMatching = (name === nameOrAlias) ||
                            (aliases && aliases!.includes(nameOrAlias));

            if (nameOrAliasMatching) {
                if ((commands && commands.includes(command)) ||
                    (commandAliases && Object.keys(commandAliases).includes(command))) {
                    result.push(pluginInfo);
                }
            }
        })
    });

    return result;
}

export function getAllPluginNames(pluginPlatform: PluginPlatform): Set<string> {
    let result = new Set<string>();

    Object.keys(pluginPlatform.plugins).forEach((pluginName) => {
        result.add(pluginName);

        pluginPlatform.plugins[pluginName].forEach((pluginInfo) => {
            if (pluginInfo.manifest.aliases &&
                    pluginInfo.manifest.aliases.length > 0) {
                pluginInfo.manifest.aliases.forEach((alias) => {
                    result.add(alias);
                })
            }
        })
    });

    return result;
}

export { scanPluginPlatform as scan };

export function addUserPluginPackage(
    pluginPlatform: PluginPlatform,
    pluginDirPath: string
): AddUserPluginResult {
    return new AddUserPluginResult(
    );
}