import { $TSContext } from 'amplify-cli-core';
import { configurePermissionBoundaryForExistingEnv } from './permission-boundary/permission-boundary';

export const updateEnv = async (context: $TSContext) => {
  await configurePermissionBoundaryForExistingEnv(context);
};
