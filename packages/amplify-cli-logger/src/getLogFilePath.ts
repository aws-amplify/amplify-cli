import path from 'path';
import { constants } from './constants';
import { getLogDirectory, getLocalLogFileDirectory } from './baseLogFilePath';

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
