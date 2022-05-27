import { AmplifyAuthTransform } from '../auth-stack-builder/auth-stack-transform';
import { $TSContext, Template } from 'amplify-cli-core';

export const generateAuthStackTemplate = async (context: $TSContext, resourceName: string): Promise<Template> => {
  const authTransform = new AmplifyAuthTransform(resourceName);
  return await authTransform.transform(context);
};
