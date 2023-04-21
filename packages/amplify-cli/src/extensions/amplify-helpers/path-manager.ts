import { $TSAny, projectNotInitializedError } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import { homedir } from 'os';
import * as path from 'path';
import { amplifyCLIConstants } from './constants';

/* Helpers */

const projectPathValidate = (projectPath): boolean => {
  if (fs.existsSync(projectPath)) {
    const amplifyDirPath = getAmplifyDirPath(projectPath);
    const infoSubDirPath = getDotConfigDirPath(projectPath);

    return fs.existsSync(amplifyDirPath) && fs.existsSync(infoSubDirPath);
  }

  return false;
};

/**
 * Get the project root directory path
 */
export const searchProjectRootPath = (): $TSAny => {
  let currentPath = process.cwd();

  do {
    if (projectPathValidate(currentPath)) {
      return currentPath;
    }

    const parentPath = path.dirname(currentPath);
    if (currentPath === parentPath) {
      return currentPath;
    }

    currentPath = parentPath;

    /* eslint-disable */
  } while (true); /* eslint-enable */
};

/**
 * Get the amplify home dot config directory path
 */
export const getHomeDotAmplifyDirPath = (): string => path.join(homedir(), amplifyCLIConstants.DotAmplifyDirName);

/**
 * returns the project amplify directory path
 */
export const getAmplifyDirPath = (projectPath?: string): string => {
  if (!projectPath) {
    // eslint-disable-next-line no-param-reassign
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(projectPath, amplifyCLIConstants.AmplifyCLIDirName));
  }

  throw projectNotInitializedError();
};

/**
 * returns the project amplify config sub directory path
 */
export const getDotConfigDirPath = (projectPath?: string): string =>
  path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.DotConfigAmplifyCLISubDirName));

/**
 * returns the project backend directory path
 */
export const getBackendDirPath = (projectPath?: string): string =>
  path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.BackendAmplifyCLISubDirName));

/**
 * returns the project current cloud backend directory path
 */
export const getCurrentCloudBackendDirPath = (projectPath?: string): string =>
  path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.CurrentCloudBackendAmplifyCLISubDirName));

/**
 * returns the project .amplifyrc file path
 */
export const getAmplifyRcFilePath = (projectPath?: string): string => {
  if (!projectPath) {
    // eslint-disable-next-line no-param-reassign
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    // eslint-disable-next-line spellcheck/spell-checker
    return path.normalize(path.join(projectPath, '.amplifyrc'));
  }

  throw projectNotInitializedError();
};

/**
 * returns the project .gitignore file path
 */
export const getGitIgnoreFilePath = (projectPath?: string): string => {
  if (!projectPath) {
    // eslint-disable-next-line no-param-reassign
    projectPath = searchProjectRootPath();
  }
  if (projectPath) {
    return path.normalize(path.join(projectPath, '.gitignore'));
  }

  throw projectNotInitializedError();
};

/**
 * returns the project project-config.json file path
 */
export const getProjectConfigFilePath = (projectPath?: string): string =>
  path.normalize(path.join(getDotConfigDirPath(projectPath), amplifyCLIConstants.ProjectConfigFileName));

/**
 * returns the project local-env-info.json file path
 */
export const getLocalEnvFilePath = (projectPath?: string): string =>
  path.normalize(path.join(getDotConfigDirPath(projectPath), amplifyCLIConstants.LocalEnvFileName));

/**
 * returns the project team-provider-info.json file path
 */
export const getProviderInfoFilePath = (projectPath?: string): string =>
  path.normalize(path.join(getAmplifyDirPath(projectPath), amplifyCLIConstants.ProviderInfoFileName));

/**
 * returns the project backend-config.json file path
 */
export const getBackendConfigFilePath = (projectPath?: string): string =>
  path.normalize(path.join(getBackendDirPath(projectPath), amplifyCLIConstants.BackendConfigFileName));

/**
 * returns the project current backend amplify config sub directory path
 */
export const getCurrentBackendConfigFilePath = (projectPath?: string): string =>
  path.normalize(path.join(getCurrentCloudBackendDirPath(projectPath), amplifyCLIConstants.BackendConfigFileName));

/**
 * returns the project amplify meta file path
 */
export const getAmplifyMetaFilePath = (projectPath?: string): string =>
  path.normalize(path.join(getBackendDirPath(projectPath), amplifyCLIConstants.amplifyMetaFileName));

/**
 * returns the project current backend amplify meta file path
 */
export const getCurrentAmplifyMetaFilePath = (projectPath?: string): string =>
  path.normalize(path.join(getCurrentCloudBackendDirPath(projectPath), amplifyCLIConstants.amplifyMetaFileName));
