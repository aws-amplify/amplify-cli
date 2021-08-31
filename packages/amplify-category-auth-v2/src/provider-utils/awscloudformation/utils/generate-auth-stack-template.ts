import { Template } from 'cloudform-types';
import { AmplifyAuthTransform } from '../auth-stack-builder/auth-stack-transform';
import { $TSContext } from 'amplify-cli-core';

export const generateAuthStackTemplate = async (context: $TSContext, resourceName: string): Promise<Template> => {
  try {
    const authTransform = new AmplifyAuthTransform(resourceName);
    return await authTransform.transform(context);
  } catch (e) {
    throw new Error(e);
  }
};
