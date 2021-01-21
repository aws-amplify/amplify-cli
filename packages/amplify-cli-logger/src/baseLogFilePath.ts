import * as path from 'path';
import { constants } from './constants';
import * as os from 'os';

function getFolder() {
  let folder = constants.LOG_DIRECTORY;

  if (process.argv.length > 1) {
    const executable = process.argv[1];

    if (executable && executable.includes('dev')) {
      folder += '-dev';
    }
  }
  return folder;
}

export function getLocalLogFileDirectory(projectPath: string): string {
  return path.join(projectPath, constants.LOG_DIRECTORY);
}

export function getLogDirectory(): string {
  return path.join(os.homedir(), constants.DOT_AMPLIFY, getFolder());
}
