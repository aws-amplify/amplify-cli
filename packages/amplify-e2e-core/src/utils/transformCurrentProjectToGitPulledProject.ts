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
  //const dir =  fs.readdirSync(projRoot);
  const dir = glob.sync('**/*', {
    cwd: projRoot,
    absolute: true,
  });

  regexrArray.forEach(str => {
    let regex;
    try {
      regex = new RegExp(str);
      dir.filter(file => regex.test(file)).map(file => fs.unlinkSync(projRoot + file));
    } catch (e) {}
  });
};
