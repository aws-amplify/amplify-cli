import * as fs from 'fs-extra';
import { ExportPathValidationError } from '../errors';
import * as path from 'path';
/**
 * Validates whether the path is a directory
 * @throws {ExportPathValidationError} if path not valid
 * @param directoryPath to validate
 */
export function validateExportDirectoryPath(directoryPath: any, defaultPath: string): string {
  const exportPath = directoryPath || defaultPath;
  const resolvedDir = path.resolve(exportPath);

  if (!fs.existsSync(resolvedDir)) {
    fs.ensureDirSync(resolvedDir);
  } else {
    const stat = fs.lstatSync(exportPath);
    if (!stat.isDirectory()) {
      throw new ExportPathValidationError(`${exportPath} is not a valid directory`);
    }
  }

  return resolvedDir;
}
