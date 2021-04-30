import { $TSContext, setPermissionBoundaryArn } from 'amplify-cli-core';
import { permissionBoundaryPrompt } from './permission-boundary/permission-boundary';

export type UpdateEnvRequest = {
  env: string;
};

export const updateEnv = async (context: $TSContext) => {
  setPermissionBoundaryArn(await permissionBoundaryPrompt(context));
};
