/* eslint-disable spellcheck/spell-checker */
import * as fs from 'fs-extra';
/**
 * Validate the given filepath
 * @param filePath - path to file
 * @returns true on success
 */
export const validateFilePath = (filePath:string):boolean|string => {
  let result = false;
  if (filePath) {
    result = fs.existsSync(filePath);
  }
  return result || 'file path must be valid';
};

module.exports = {
  validateFilePath,
};
