import { $TSContext } from 'amplify-cli-core';
import { configurePermissionBoundaryForExistingEnv } from './permission-boundary/permission-boundary';

export type UpdateEnvRequest = {
  env: string;
};

export const updateEnv = async (context: $TSContext) => {
  await configurePermissionBoundaryForExistingEnv(context);
};
