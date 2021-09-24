import { $TSContext, Template } from 'amplify-cli-core';
import { AmplifyRootStackTransform } from '../root-stack-builder';

export * from './transform-cfn';

export const transformRootStack = async (context: $TSContext): Promise<Template> => {
  try {
    const resourceName = 'awscloudformation';
    return new AmplifyRootStackTransform(resourceName).transform(context);
  } catch (error) {
    throw new Error(error);
  }
};
