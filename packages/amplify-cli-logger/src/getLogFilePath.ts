import path from 'path';
import os from 'os';
import { constants } from './constants';
export function getLogFilePath(): string {
  return path.join(os.homedir(), constants.DOT_AMPLIFY, getFolder(), constants.LOG_FILENAME);
}

export function getLocalLogFilePath(projectPath: string): string {
  return path.join(projectPath, constants.LOG_DIRECTORY, constants.LOG_FILENAME);
}

function getFolder() {
  const executable = process.argv[1];
  let folder = constants.LOG_DIRECTORY;

  if (executable && executable.includes('dev')) {
    folder += '-dev';
  }
  return folder;
}

export function getLogAuditFilePath(local: boolean): string {
  return path.join(
    os.homedir(),
    constants.DOT_AMPLIFY,
    getFolder(),
    constants.LOG_AUDIT_FOLDER,
    local ? 'local' : 'global',
    constants.LOG_AUDIT_FILENAME,
  );
}
