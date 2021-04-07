import * as path from 'path';
import * as fs from 'fs-extra';
import { homedir } from 'os';
import { amplifyCLIConstants } from './constants';

/* Helpers */

function projectPathValidate(projectPath) {
  let isGood = false;
  if (fs.existsSync(projectPath)) {
    const amplifyDirPath = getAmplifyDirPath(projectPath);
    const infoSubDirPath = getDotConfigDirPath(projectPath);

    isGood = fs.existsSync(amplifyDirPath) && fs.existsSync(infoSubDirPath);
  }
  return isGood;
}

export function searchProjectRootPath() {
  let result;
  let currentPath = process.cwd();

  do {
    if (projectPathValidate(currentPath)) {
      result = currentPath;
      break;
    } else {
      const parentPath = path.dirname(currentPath);
      if (currentPath === parentPath) {
        break;
      } else {
        currentPath = parentPath;
      }
    }
    /* eslint-disable */
  } while (true); /* eslint-enable */

  return result;
}

export function getHomeDotAmplifyDirPath() {
  return path.join(homedir(), amplifyCLIConstants.DotAmplifyDirName);
}

// ///////////////////level 0
export function getAmplifyDirPath(projectPath?) {
  if (!projectPath) {
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(projectPath, amplifyCLIConstants.AmplifyCLIDirName));
  }
  throw createNotInitializedError();
}

// ///////////////////level 1
export function getDotConfigDirPath(projectPath?) {
  return path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.DotConfigamplifyCLISubDirName));
}

export function getBackendDirPath(projectPath?) {
  return path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.BackendamplifyCLISubDirName));
}

export function getCurrentCloudBackendDirPath(projectPath?) {
  return path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.CurrentCloudBackendamplifyCLISubDirName));
}

export function getAmplifyRcFilePath(projectPath?) {
  if (!projectPath) {
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(projectPath, '.amplifyrc'));
  }
  throw createNotInitializedError();
}

export function getGitIgnoreFilePath(projectPath?) {
  if (!projectPath) {
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(projectPath, '.gitignore'));
  }
  throw createNotInitializedError();
}

// ///////////////////level 2

export function getProjectConfigFilePath(projectPath?) {
  return path.normalize(path.join(getDotConfigDirPath(projectPath), amplifyCLIConstants.ProjectConfigFileName));
}

export function getLocalEnvFilePath(projectPath?) {
  return path.normalize(path.join(getDotConfigDirPath(projectPath), amplifyCLIConstants.LocalEnvFileName));
}

export function getProviderInfoFilePath(projectPath?) {
  return path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.ProviderInfoFileName));
}

export function getBackendConfigFilePath(projectPath?) {
  return path.normalize(path.join(getBackendDirPath(projectPath), amplifyCLIConstants.BackendConfigFileName));
}

export function getCurrentBackendConfigFilePath(projectPath?) {
  return path.normalize(path.join(getCurrentCloudBackendDirPath(projectPath), amplifyCLIConstants.BackendConfigFileName));
}

export function getAmplifyMetaFilePath(projectPath?) {
  return path.normalize(path.join(getBackendDirPath(projectPath), amplifyCLIConstants.amplifyMetaFileName));
}

export function getCurrentAmplifyMetaFilePath(projectPath?) {
  return path.normalize(path.join(getCurrentCloudBackendDirPath(projectPath), amplifyCLIConstants.amplifyMetaFileName));
}

function createNotInitializedError() {
  const error = new Error(
    `
      No Amplify backend project files detected within this folder. Either initialize a new Amplify project or pull an existing project.
      - "amplify init" to initialize a new Amplify project
      - "amplify pull <app-id>" to pull your existing Amplify project. Find the <app-id> in the AWS Console or Amplify Admin UI.
      `,
  );

  error.name = 'NotInitialized';
  error.stack = undefined;

  return error;
}
