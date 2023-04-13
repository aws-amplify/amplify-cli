import { $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { categoryName } from '../../constants';
import {
  FunctionSecretsStateManager,
  getLocalFunctionSecretNames,
} from '../../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { isFunctionPushed } from '../../provider-utils/awscloudformation/utils/funcionStateUtils';
import { removeResource } from '../../provider-utils/awscloudformation/service-walkthroughs/removeFunctionWalkthrough';
import { removeWalkthrough } from '../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough';
import { printer } from '@aws-amplify/amplify-prompts';

const subcommand = 'remove';

export const name = subcommand;

/**
 * Entry point for removing a function
 */
export const run = async (context: $TSContext): Promise<void> => {
  const { amplify, parameters } = context;

  let resourceName = parameters.first;
  let resourceToBeDeleted = '';

  const response = await removeResource(resourceName);

  if (response.isLambdaLayer) {
    printer.info(
      'When you delete a layer version, you can no longer configure functions to use it.\nHowever, any function that already uses the layer version continues to have access to it.',
    );

    resourceToBeDeleted = await removeWalkthrough(context, response.resourceName);

    if (!resourceToBeDeleted) {
      return;
    }

    resourceName = resourceToBeDeleted;
  } else {
    resourceName = response.resourceName;
  }

  let hasSecrets = false;

  const resourceNameCallback = async (funcName: string): Promise<void> => {
    hasSecrets = getLocalFunctionSecretNames(funcName).length > 0;
  };

  try {
    await amplify.removeResource(context, categoryName, resourceName, undefined, resourceNameCallback);
    // if the resource has not been pushed and it has secrets, we need to delete them now
    // otherwise we will orphan the secrets in the cloud
    if (!isFunctionPushed(resourceName) && hasSecrets) {
      const functionSecretsManager = await FunctionSecretsStateManager.getInstance(context);
      await functionSecretsManager.deleteAllFunctionSecrets(resourceName);
    }
  } catch (e) {
    throw new AmplifyFault(
      'ResourceRemoveFault',
      {
        message: 'An error occurred when removing the function resource',
      },
      e,
    );
  }
};
