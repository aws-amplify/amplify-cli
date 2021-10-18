import * as fs from 'fs-extra';
import { ExportPathValidationError } from '../errors';

/**
 * Validates whether the path is a directory
 * @throws {ExportPathValidationError} if path not valid
 * @param directoryPath to validate
 */
export function validateExportDirectoryPath(directoryPath: any) {
  if (typeof directoryPath !== 'string') {
    throw new ExportPathValidationError(`${directoryPath} is not a valid path specified by --out`);
  }

  if (!fs.existsSync(directoryPath)) {
    throw new ExportPathValidationError(`${directoryPath} does not exist`);
  }

  const stat = fs.lstatSync(directoryPath);
  if (!stat.isDirectory()) {
    throw new ExportPathValidationError(`${directoryPath} is not a valid directory`);
  }
}
