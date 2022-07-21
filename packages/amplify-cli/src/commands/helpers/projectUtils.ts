import { pathManager } from 'amplify-cli-core';

/**
 * checks if the current directory is a nested project
 */
export const checkForNestedProject = (): void => {
  const projectRoot = pathManager.findProjectRoot() ?? process.cwd();
  if (projectRoot !== process.cwd()) {
    throw new Error(`Creating a nested amplify project is not supported. Project root detected: ${projectRoot}`);
  }
};
