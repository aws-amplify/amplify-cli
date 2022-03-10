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
  const regexArray = fs.readFileSync(gitIgnoreFilePath, 'utf-8').split('\n');
  regexArray.forEach(str => {
    const dirPath = glob.sync(str, {
      cwd: projRoot,
      absolute: true,
    });
    dirPath.forEach(file => {
      if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) {
        fs.removeSync(file);
      } else {
        fs.unlinkSync(file);
      }
    });
  });
};
