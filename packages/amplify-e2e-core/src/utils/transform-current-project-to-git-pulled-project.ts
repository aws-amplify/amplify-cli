import { pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import glob from 'glob';

/**
 *
 * @param projRoot : string
 * deleting files matching .gitignore regex
 */
export const transformCurrentProjectToGitPulledProject = (projRoot: string) => {
  const gitIgnoreFilePath = pathManager.getGitIgnoreFilePath(projRoot);
  const regexrArray = fs.readFileSync(gitIgnoreFilePath, 'utf-8').split('\n');
  regexrArray.forEach(str => {
    if (str.endsWith('/')) {
      str = str.split('/')[0];
    }
    const dirPath = glob.sync(str, {
      cwd: projRoot,
      absolute: true,
      matchBase: true,
    });
    dirPath.forEach(file => {
      try {
        if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) {
          fs.removeSync(file);
        } else {
          fs.unlinkSync(file);
        }
      } catch (err) {}
    });
  });
};
