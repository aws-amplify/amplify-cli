import { JSONUtilities } from './jsonUtilities';
import { pathManager, stateManager } from './state-manager';
import _ from 'lodash';

const backendConfigObjectPath = ['providers', 'awscloudformation', 'PermissionBoundaryPolicyArn'];

export const getPermissionBoundaryArn: () => string | undefined = () => {
  const backendConfig = stateManager.getBackendConfig();
  return _.get(backendConfig, backendConfigObjectPath) as string | undefined;
};

export const setPermissionBoundaryArn: (arn?: string) => void = arn => {
  const backendConfig = stateManager.getBackendConfig();
  if (!arn) {
    _.unset(backendConfig, backendConfigObjectPath);
  } else {
    _.set(backendConfig, backendConfigObjectPath, arn);
  }
  const backendConfigPath = pathManager.getBackendConfigFilePath();
  JSONUtilities.writeJson(backendConfigPath, backendConfig);
};
