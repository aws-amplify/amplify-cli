import { $TSContext, Template } from 'amplify-cli-core';
import { AmplifyAuthTransform } from '../auth-stack-builder/auth-stack-transform';

/**
 *  generates cfn template for Auth
 */
export const generateAuthStackTemplate = async (context: $TSContext, resourceName: string): Promise<Template | undefined> => {
  const authTransform = new AmplifyAuthTransform(resourceName);
  const template = await authTransform.transform(context);
  if (template) {
    return template;
  }

  throw new Error('Cant find the generated template');
};
