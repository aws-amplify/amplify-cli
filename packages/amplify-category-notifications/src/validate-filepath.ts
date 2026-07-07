import * as fs from 'fs-extra';

/**
 * Validate the given filePath
 * @param filePath - path to file
 * @returns true on success
 */
export const validateFilePath = (filePath: string): string | true => {
  if (filePath && fs.existsSync(filePath)) {
    return true;
  }
  return 'file path must be valid';
};
