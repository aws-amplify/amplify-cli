import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { configurePermissionsBoundaryForExistingEnv } from './permissions-boundary/permissions-boundary';

export const updateEnv = async (context: $TSContext) => {
  await configurePermissionsBoundaryForExistingEnv(context);
};
