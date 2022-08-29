import { AmplifyError, pathManager } from 'amplify-cli-core';

/**
 * checks if the current directory is a nested project
 */
export const checkForNestedProject = (): void => {
  const projectRoot = pathManager.findProjectRoot() ?? process.cwd();
  if (projectRoot !== process.cwd()) {
    throw new AmplifyError('NestedProjectInitError', {
      message: 'Creating a nested amplify project is not supported',
      details: `Project root detected in: ${projectRoot}`,
      resolution: 'Please run amplify in the root of your project',
    });
  }
};
