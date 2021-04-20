import { stateManager } from './state-manager';
import _ from 'lodash';

const backendConfigObjectPath = ['providers', 'awscloudformation', 'PermissionBoundaryPolicyArn'];

export const getPermissionBoundaryArn: () => string | undefined = () => {
  try {
    const backendConfig = stateManager.getBackendConfig();
    return _.get(backendConfig, backendConfigObjectPath) as string | undefined;
  } catch (err) {
    // uninitialized project
    return undefined;
  }
};

export const setPermissionBoundaryArn: (arn?: string) => void = arn => {
  const backendConfig = stateManager.getBackendConfig();
  if (!arn) {
    _.unset(backendConfig, backendConfigObjectPath);
  } else {
    _.set(backendConfig, backendConfigObjectPath, arn);
  }
  stateManager.setBackendConfig(undefined, backendConfig);
};
