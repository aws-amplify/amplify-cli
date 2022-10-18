import fs from 'fs-extra';
import path from 'path';
import constants from './constants';

/**
 Run project scanner
 */
export const run = (projectPath): number => {
  let score = constants.ProjectScanBaseScore;
  const packageJsonFilePath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonFilePath)) {
    score = constants.ProjectScanMaxScore;
  }
  return score;
};

export default {
  run,
};
