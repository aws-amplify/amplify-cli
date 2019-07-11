import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import PluginPlatform from '../domain/plugin-platform';
import constants from '../domain/constants';
import readJsonFile from '../utils/readJsonFile';

export function readPluginsJsonFile(): PluginPlatform | undefined {
    let result: PluginPlatform | undefined;
    const pluginsFilePath = path.join(os.homedir(),
        constants.DotAmplifyDirName, constants.PLUGINS_FILE_NAME);
    if (fs.existsSync(pluginsFilePath)) {
        result = readJsonFile(pluginsFilePath)
    }
    return result;
}

export function writePluginsJsonFile(pluginsJson: PluginPlatform): void {
    const systemDotAmplifyDirPath = path.join(os.homedir(), constants.DotAmplifyDirName);
    const pluginsJsonFilePath = path.join(systemDotAmplifyDirPath, constants.PLUGINS_FILE_NAME);

    fs.ensureDirSync(systemDotAmplifyDirPath);

    const jsonString = JSON.stringify(pluginsJson, null, 4);
    fs.writeFileSync(pluginsJsonFilePath, jsonString, 'utf8');
}