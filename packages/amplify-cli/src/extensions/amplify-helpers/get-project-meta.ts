import * as fs from 'fs-extra';
import { readJsonFile } from './read-json-file';
import { getAmplifyMetaFilePath } from './path-manager';

export function getProjectMeta() {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();

  if (!amplifyMetaFilePath || !fs.existsSync(amplifyMetaFilePath)) {
    const error = new Error(
      "You are not working inside a valid Amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project, or 'amplify pull' to pull down an existing project.",
    );

    error.name = 'NotInitialized';
    error.stack = undefined;

    throw error;
  }

  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  return amplifyMeta;
}
