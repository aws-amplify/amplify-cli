import { $TSContext, Template } from '@aws-amplify/amplify-cli-core';
import { AmplifyRootStackTransform } from '../root-stack-builder';

// eslint-disable-next-line import/no-cycle
export * from './transform-resource';

/**
 * transform the amplify root stack
 */
export const transformRootStack = async (context: $TSContext): Promise<Template> => {
  const resourceName = 'awscloudformation';
  const rootStack = new AmplifyRootStackTransform(resourceName);
  return rootStack.transform(context);
};
