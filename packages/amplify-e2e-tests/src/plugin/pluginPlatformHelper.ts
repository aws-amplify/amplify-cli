import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { readJsonFileSync } from 'amplify-e2e-core';

export function readPluginsJsonFile(): any {
  let result;
  const pluginsFilePath = getPluginFilePath();
  if (fs.existsSync(pluginsFilePath)) {
    result = readJsonFileSync(pluginsFilePath);
  }
  return result;
}

export function writePluginsJsonFile(pluginPlatform: any) {
  let result;
  const pluginsFilePath = getPluginFilePath();
  fs.writeFileSync(pluginsFilePath, JSON.stringify(pluginPlatform, null, 4));
  return result;
}

function getPluginFilePath(): string {
  return path.join(os.homedir(), '.amplify', 'plugins.json');
}
