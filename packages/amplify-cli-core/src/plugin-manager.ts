import path from 'path';
import os from 'os';
import fs, { read } from 'fs-extra';
import PluginCollection from './domain/plugin-collection';
import PluginPlatform from './domain/plugin-platform';
import constants from './domain/constants';
import readJsonFile from './utils/readJsonFile';
import { getGlobalNodeModuleDirPath } from './utils/global-prefix';
import PluginVerificationResult from './domain/plugin-verification-result';
import PluginManifest from './domain/plugin-manifest';
import PluginInfo from './domain/plugin-Info';
import {AmplifyEvent} from './domain/amplify-event';

export function getPlugins(): PluginCollection {
    //This function is called at the beginning of each command execution
    //ToDo: This function performance the following actions:
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
            pluginPlatform = scan();
        }
    } else {
        pluginPlatform = scan();
    }

    return (pluginPlatform as PluginPlatform).plugins;
}

function readPluginsJsonFile(): PluginPlatform | undefined {
    let result: PluginPlatform | undefined;
    const pluginsFilePath = path.join(os.homedir(), constants.DotAmplifyDirName, constants.PLUGINS_FILE_NAME);
    if (fs.existsSync(pluginsFilePath)) {
        result = readJsonFile(pluginsFilePath)
    }
    return result;
}

function writePluginsJsonFile(pluginsJson: PluginPlatform): void {
    const systemDotAmplifyDirPath = path.join(os.homedir(), constants.DotAmplifyDirName);
    const pluginsJsonFilePath = path.join(systemDotAmplifyDirPath, constants.PLUGINS_FILE_NAME);

    fs.ensureDirSync(systemDotAmplifyDirPath);

    const jsonString = JSON.stringify(pluginsJson, null, 4);
    fs.writeFileSync(pluginsJsonFilePath, jsonString, 'utf8');
}

export function scan(): PluginPlatform {
    let pluginPlatform = readPluginsJsonFile() || new PluginPlatform();

    pluginPlatform.plugins = new PluginCollection();
    pluginPlatform.pluginDirectories.forEach((directory) => {
        if (directory === constants.LocalNodeModules) {
            directory = path.normalize(path.join(__dirname, '../node_modules'));
        } else if (directory === constants.ParentDirectory) {
            directory = path.normalize(path.join(__dirname, '../../'));
        } else if (directory === constants.GlobalNodeModules) {
            directory = getGlobalNodeModuleDirPath();
        }

        if (fs.existsSync(directory)) {
            const subDirNames = fs.readdirSync(directory);
            subDirNames.forEach((subDirName) => {
                const subDirPath = path.join(directory, subDirName);
                const pluginVerificationResult = verifyPlugin(pluginPlatform, subDirPath);
                if (pluginVerificationResult.verified) {
                    //ToDo: resolve plugin package duplications
                    const manifest = pluginVerificationResult.manifest as PluginManifest;
                    const { name, version } = pluginVerificationResult.packageJson;
                    pluginPlatform.plugins[manifest.name] =
                        pluginPlatform.plugins[manifest.name] || [];
                    const pluginInfo = new PluginInfo(name, version, subDirPath, manifest);
                    pluginPlatform.plugins[manifest.name].push(pluginInfo);
                }
            });
        }
    });

    pluginPlatform.lastScanTime = new Date();
    writePluginsJsonFile(pluginPlatform);

    return pluginPlatform;
}

function verifyPlugin(pluginPlatform: PluginPlatform, pluginDirPath: string):
PluginVerificationResult {
    const result = new PluginVerificationResult();

    if (fs.existsSync(pluginDirPath) && fs.statSync(pluginDirPath).isDirectory()) {
        const pluginDirName = path.basename(pluginDirPath);
        let isMatchingNamePattern = true;
        if (pluginPlatform.pluginPrefixes && pluginPlatform.pluginPrefixes.length > 0) {
            isMatchingNamePattern = pluginPlatform.pluginPrefixes.some((prefix) => {
                const regex = new RegExp(`^${prefix}`);
                return regex.test(pluginDirName);
            });
        }
        if (isMatchingNamePattern) {
            const pluginManifestFilePath = path.join(pluginDirPath, constants.MANIFEST_FILE_NAME);
            const pluginPackageJsonFilePath = path.join(pluginDirPath, constants.PACKAGEJSON_FILE_NAME);
            if (fs.existsSync(pluginManifestFilePath) && fs.statSync(pluginManifestFilePath).isFile() &&
            fs.existsSync(pluginPackageJsonFilePath) && fs.statSync(pluginPackageJsonFilePath).isFile()) {
                try {
                    const pluginModule = require(pluginDirPath);
                    const pluginManifest = readJsonFile(pluginManifestFilePath);
                    if (verifyModule(pluginModule) && verifyManifest(pluginManifest, pluginModule)) {
                        result.manifest = pluginManifest;
                        result.packageJson = readJsonFile(pluginPackageJsonFilePath);
                        result.verified = true;
                    }
                } catch (e) {
                    result.verified = false;
                }
            }
        }
    }

    return result;
}

function verifyModule(pluginModule: any): boolean {
    return pluginModule.hasOwnProperty(constants.ExecuteAmplifyCommand) &&
        typeof pluginModule[constants.ExecuteAmplifyCommand] === 'function';
}

function verifyManifest(manifest: any, pluginModule: any): boolean {
    return manifest.name && typeof manifest.name === 'string' &&
        manifest.type && typeof manifest.type === 'string' &&
        verifyCommands(manifest) && verifySubscriptions(manifest, pluginModule);
}

function verifyCommands(manifest: any): boolean {
    let result = false;
    if (manifest && manifest.commands) {
        const { commands } = manifest;
        result = commands && commands instanceof Array &&
            commands.length > 0 && commands.includes(constants.HELP);
    }
    return result;
}

function verifySubscriptions(manifest: any, pluginModule: any): boolean {
    let result = true; //subscriptions field is not mandatory

    if (manifest && manifest.subscriptions) {
        result = false;
        if (manifest.subscriptions instanceof Array) {
            let trimmedSubscriptions = trimSubscriptions(manifest.subscriptions);
            if (trimmedSubscriptions.length > 0) {
                result = pluginModule.hasOwnProperty(constants.HandleAmplifyEvent) &&
                    typeof pluginModule[constants.HandleAmplifyEvent] === 'function';
            } else {
                result = true;
            }
            manifest.subscriptions = trimmedSubscriptions;
        }
    }

    return result;
}

function trimSubscriptions(subscriptions: Array<string>): Array<string> {
    let trimmedSubscription = new Array<string>();

    subscriptions.forEach((event) => {
        if (Object.keys(AmplifyEvent).includes(event)) {
            trimmedSubscription.push(event);
        }
    })

    return trimmedSubscription;
}