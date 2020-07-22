import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { PluginPlatform } from '../domain/plugin-platform';
import { constants } from '../domain/constants';
import { readJsonFile, readJsonFileSync } from '../utils/readJsonFile';

const JSON_SPACE = 4;

export function readPluginsJsonFileSync(): PluginPlatform | undefined {
  let result: PluginPlatform | undefined;
  const pluginsFilePath = getPluginsJsonFilePath();

  if (fs.existsSync(pluginsFilePath)) {
    result = readJsonFileSync(pluginsFilePath);
  }

  return result;
}

export async function readPluginsJsonFile(): Promise<PluginPlatform | undefined> {
  let result: PluginPlatform | undefined;
  const pluginsFilePath = getPluginsJsonFilePath();

  const exists = await fs.pathExists(pluginsFilePath);

  if (exists) {
    result = await readJsonFile(pluginsFilePath);
  }

  return result;
}

export function writePluginsJsonFileSync(pluginsJson: PluginPlatform): void {
  const systemDotAmplifyDirPath = getSystemDotAmplifyDirPath();
  const pluginsJsonFilePath = path.join(systemDotAmplifyDirPath, getPluginsJsonFileName());

  fs.ensureDirSync(systemDotAmplifyDirPath);

  const jsonString = JSON.stringify(pluginsJson, null, JSON_SPACE);
  fs.writeFileSync(pluginsJsonFilePath, jsonString, 'utf8');
}

export async function writePluginsJsonFile(pluginsJson: PluginPlatform): Promise<void> {
  const systemDotAmplifyDirPath = getSystemDotAmplifyDirPath();
  const pluginsJsonFilePath = path.join(systemDotAmplifyDirPath, getPluginsJsonFileName());

  await fs.ensureDir(systemDotAmplifyDirPath);

  const jsonString = JSON.stringify(pluginsJson, null, JSON_SPACE);
  await fs.writeFile(pluginsJsonFilePath, jsonString, 'utf8');
}

function getPluginsJsonFilePath(): string {
  return path.join(getSystemDotAmplifyDirPath(), getPluginsJsonFileName());
}

function getSystemDotAmplifyDirPath(): string {
  return path.join(os.homedir(), constants.DotAmplifyDirName);
}

function getPluginsJsonFileName(): string {
  let result = constants.PLUGINS_FILE_NAME;
  const amplifyExecutableName = path.basename(process.argv[1]);

  if (amplifyExecutableName === 'amplify-dev') {
    result = `${amplifyExecutableName}-${constants.PLUGINS_FILE_NAME}`;
  }

  return result;
}
