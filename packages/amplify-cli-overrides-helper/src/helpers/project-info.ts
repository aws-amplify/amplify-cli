import { stateManager } from 'amplify-cli-core';
import { AmplifyProjectInfo } from '../types';

export function getProjectInfo(): AmplifyProjectInfo {
  const localEnvInfo = stateManager.getLocalEnvInfo();
  const projectConfig = stateManager.getProjectConfig();

  const projectInfo: AmplifyProjectInfo = {
    envName: localEnvInfo.envName,
    projectName: projectConfig.projectName,
  };

  return projectInfo;
}
