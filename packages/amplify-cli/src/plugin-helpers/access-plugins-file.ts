import * as path from 'path';
import * as os from 'os';
import { PluginPlatform, constants, JSONUtilities } from 'amplify-cli-core';

export function readPluginsJsonFile(): PluginPlatform | undefined {
  const pluginsFilePath = getPluginsJsonFilePath();

  return JSONUtilities.readJson<PluginPlatform>(pluginsFilePath, {
    throwIfNotExist: false,
  });
}

export function writePluginsJsonFile(pluginsJson: PluginPlatform): void {
  const systemDotAmplifyDirPath = getSystemDotAmplifyDirPath();
  const pluginsJsonFilePath = path.join(systemDotAmplifyDirPath, getPluginsJsonFileName());

  JSONUtilities.writeJson(pluginsJsonFilePath, pluginsJson);
}

function getPluginsJsonFilePath(): string {
  return path.join(getSystemDotAmplifyDirPath(), getPluginsJsonFileName());
}

function getSystemDotAmplifyDirPath(): string {
  return path.join(os.homedir(), constants.DOT_AMPLIFY_DIR_NAME);
}

function getPluginsJsonFileName(): string {
  let result = constants.PLUGINS_FILE_NAME;
  const amplifyExecutableName = path.basename(process.argv[1]);

  if (amplifyExecutableName === 'amplify-dev') {
    result = `${amplifyExecutableName}-${constants.PLUGINS_FILE_NAME}`;
  }

  return result;
}
