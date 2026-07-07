import { $TSContext, Template } from '@aws-amplify/amplify-cli-core';
import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { AmplifyAuthTransform } from '../auth-stack-builder/auth-stack-transform';

/**
 * Creates the auth stack and build artifacts
 */
export const generateAuthStackTemplate = async (context: $TSContext, resourceName: string): Promise<Template> => {
  await ensureEnvParamManager();
  const authTransform = new AmplifyAuthTransform(resourceName);
  return authTransform.transform(context);
};
