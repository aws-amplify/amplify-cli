import * as path from 'path';
import { pathManager } from 'amplify-cli-core';
import { homedir } from 'os';
import * as fs from 'fs-extra';

export const oldVersionPath = path.join(pathManager.getHomeDotAmplifyDirPath(), 'bin', 'amplify-old.exe');
export const uninstalPath = path.join(homedir(), 'amplify-pending-delete.exe');

export const deleteOldVersion = () => {
  if (process.platform.startsWith('win') && fs.existsSync(oldVersionPath)) {
    try {
      fs.removeSync(oldVersionPath);
    } catch (err) {
      console.warn(`Failed to clean up previous CLI installation at [${oldVersionPath}].`);
      console.log(err);
      console.warn('Make sure this file is not open anywhere else.');
    }
  }
};
