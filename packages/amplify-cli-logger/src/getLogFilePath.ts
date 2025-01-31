import path from 'path';
import os from 'os';
import { constants } from './constants';

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

function getLocalLogFileDirectory(projectPath: string): string {
  return path.join(projectPath, constants.LOG_DIRECTORY);
}

function getLogDirectory(): string {
  return path.join(os.homedir(), constants.DOT_AMPLIFY, getFolder());
}

export function getLogFilePath(): string {
  return path.join(getLogDirectory(), constants.LOG_FILENAME);
}

export function getLogAuditFilePath(): string {
  return path.join(getLogDirectory(), constants.LOG_AUDIT_FOLDER, constants.LOG_AUDIT_FILENAME);
}

export function getLocalLogFilePath(projectPath: string): string {
  return path.join(getLocalLogFileDirectory(projectPath), constants.LOG_FILENAME);
}

export function getLocalAuditLogFile(filePath: string): string {
  return path.join(getLocalLogFileDirectory(filePath), constants.LOG_AUDIT_FOLDER, constants.LOG_AUDIT_FILENAME);
}
