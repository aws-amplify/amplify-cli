import { stateManager } from '@aws-amplify/amplify-cli-core';
import { AmplifyProjectInfo } from '../types';

/**
 * get project Info
 */
export const getProjectInfo = (): AmplifyProjectInfo => {
  const localEnvInfo = stateManager.getLocalEnvInfo();
  const projectConfig = stateManager.getProjectConfig();

  const projectInfo: AmplifyProjectInfo = {
    envName: localEnvInfo.envName,
    projectName: projectConfig.projectName,
  };

  return projectInfo;
};
