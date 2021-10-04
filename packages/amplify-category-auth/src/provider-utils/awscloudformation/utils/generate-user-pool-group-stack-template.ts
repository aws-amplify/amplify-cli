import { $TSContext } from 'amplify-cli-core';
import { Template } from 'cloudform-types';
import { AmplifyUserPoolGroupTransform } from '../auth-stack-builder/user-pool-group-stack-transform';

export const generateUserPoolGroupStackTemplate = async (context: $TSContext, resourceName: string): Promise<Template> => {
  try {
    const userPoolTransform = new AmplifyUserPoolGroupTransform(resourceName);
    return await userPoolTransform.transform(context);
  } catch (e) {
    throw new Error(e);
  }
};
