import path from 'path';
import fs from 'fs-extra';
import PluginCollection from '../domain/plugin-collection';
import PluginPlatform from '../domain/plugin-platform';
import constants from '../domain/constants';
import { getGlobalNodeModuleDirPath } from '../utils/global-prefix';
import PluginManifest from '../domain/plugin-manifest';
import PluginInfo from '../domain/plugin-info';
import {verifyPlugin} from './verify-plugin';
import {readPluginsJsonFile, writePluginsJsonFile} from './access-plugins-file';

export default function scanPluginPlatform(): PluginPlatform {
    let pluginPlatform = readPluginsJsonFile() || new PluginPlatform();

    pluginPlatform.plugins = new PluginCollection();
    // pluginPlatform.aliasMappings = new PluginCollection();

    pluginPlatform.pluginDirectories.forEach((directory) => {
        if (directory === constants.LocalNodeModules) {
            directory = path.normalize(path.join(__dirname, '../node_modules'));
        } else if (directory === constants.ParentDirectory) {
            directory = path.normalize(path.join(__dirname, '../../../'));
        } else if (directory === constants.GlobalNodeModules) {
            directory = getGlobalNodeModuleDirPath();
        }

        if (fs.existsSync(directory)) {
            const subDirNames = fs.readdirSync(directory);
            subDirNames.forEach((subDirName) => {
                if (isMatchingNamePattern(pluginPlatform.pluginPrefixes, subDirName)) {
                    const pluginDirPath = path.join(directory, subDirName);
                    verifyAndAdd(pluginPlatform, pluginDirPath);
                }
            });
        }
    });


    if (pluginPlatform.userAddedLocations && pluginPlatform.userAddedLocations.length > 0) {
        pluginPlatform.userAddedLocations.forEach((pluginDirPath) => {
            verifyAndAdd(pluginPlatform, pluginDirPath);
        });
    }

    pluginPlatform.lastScanTime = new Date();
    writePluginsJsonFile(pluginPlatform);

    return pluginPlatform;
}

function isMatchingNamePattern(pluginPrefixes: string[], pluginDirName: string): boolean {
    let isMatchingNamePattern = true;
    if (pluginPrefixes && pluginPrefixes.length > 0) {
        isMatchingNamePattern = pluginPrefixes.some((prefix) => {
            const regex = new RegExp(`^${prefix}`);
            return regex.test(pluginDirName);
        });
    }
    return isMatchingNamePattern;
}

function verifyAndAdd(pluginPlatform: PluginPlatform, pluginDirPath: string) {
    const pluginVerificationResult = verifyPlugin(pluginDirPath);
    if (pluginVerificationResult.verified) {
        //ToDo: resolve plugin package duplications
        const manifest = pluginVerificationResult.manifest as PluginManifest;
        const { name, version } = pluginVerificationResult.packageJson;

        pluginPlatform.plugins[manifest.name] =
            pluginPlatform.plugins[manifest.name] || [];
        const pluginInfo = new PluginInfo(name, version, pluginDirPath, manifest);
        pluginPlatform.plugins[manifest.name].push(pluginInfo);

        // if (manifest.aliases && manifest.aliases.length > 0) {
        //     manifest.aliases!.forEach((alias) => {
        //         if (alias !== manifest.name) {
        //             pluginPlatform.aliasMappings[alias] =
        //                 pluginPlatform.aliasMappings[alias] || [];
        //             pluginPlatform.aliasMappings[alias].push(pluginInfo);
        //         }
        //     })
        // }
    }
}