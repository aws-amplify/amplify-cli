import { categoryName } from '../../constants';
import {
  FunctionSecretsStateManager,
  getLocalFunctionSecretNames,
} from '../../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { ServiceName } from '../../provider-utils/awscloudformation/utils/constants';
import { isFunctionPushed } from '../../provider-utils/awscloudformation/utils/funcionStateUtils';
import { removeLayerArtifacts } from '../../provider-utils/awscloudformation/utils/storeResources';
import { removeResource } from '../../provider-utils/awscloudformation/service-walkthroughs/removeFunctionWalkthrough';
import { removeWalkthrough } from '../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough';
import { $TSContext } from 'amplify-cli-core';

const subcommand = 'remove';

module.exports = {
  name: subcommand,
  run: async (context: $TSContext) => {
    const { amplify, parameters } = context;

    let resourceName = parameters.first;
    let resourceToBeDeleted = '';

    const response = await removeResource(resourceName);

    if (response.isLambdaLayer) {
      context.print.info(
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

    const resourceNameCallback = async (resourceName: string) => {
      hasSecrets = getLocalFunctionSecretNames(resourceName).length > 0;
    };

    return amplify
      .removeResource(context, categoryName, resourceName, undefined, resourceNameCallback)
      .then(async (resource: { service: string; resourceName: string }) => {
        if (resource?.service === ServiceName.LambdaLayer) {
          removeLayerArtifacts(context, resource.resourceName);
        }

        // if the resource has not been pushed and it has secrets, we need to delete them now -- otherwise we will orphan the secrets in the cloud
        if (!isFunctionPushed(resourceName) && hasSecrets) {
          await (await FunctionSecretsStateManager.getInstance(context)).deleteAllFunctionSecrets(resourceName);
        }
      })
      .catch(err => {
        if (err.stack) {
          context.print.info(err.stack);
          context.print.error('An error occurred when removing the function resource');
        }

        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
