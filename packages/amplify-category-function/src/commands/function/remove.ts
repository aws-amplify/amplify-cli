import { category as categoryName } from '../../constants';
import {
  FunctionSecretsStateManager,
  getLocalFunctionSecretNames,
} from '../../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { ServiceName } from '../../provider-utils/awscloudformation/utils/constants';
import { isFunctionPushed } from '../../provider-utils/awscloudformation/utils/funcionStateUtils';
import { removeLayerArtifacts } from '../../provider-utils/awscloudformation/utils/storeResources';

const subcommand = 'remove';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    let hasSecrets = false;

    const resourceNameCallback = (resourceName: string) => {
      hasSecrets = getLocalFunctionSecretNames(resourceName).length > 0;
    };

    return amplify
      .removeResource(context, categoryName, resourceName, {
        serviceDeletionInfo: {
          LambdaLayer:
            'When you delete a layer version, you can no longer configure functions to use it.\nHowever, any function that already uses the layer version continues to have access to it.',
        },
        serviceSuffix: { Lambda: '(function)', LambdaLayer: '(layer)' },
        resourceNameCallback,
      })
      .then(async (resource: { service: string; resourceName: string }) => {
        if (resource.service === ServiceName.LambdaLayer) {
          removeLayerArtifacts(context, resource.resourceName);
        }

        // if the resource has not been pushed and it has secrets, we need to delete them now -- otherwise we will orphan the secrets in the cloud
        if (!isFunctionPushed(resourceName) && hasSecrets) {
          await (await FunctionSecretsStateManager.getInstance(context)).deleteAllFunctionSecrets(resourceName);
        }
      })
      .catch(err => {
        context.print.info(err.stack);
        context.print.error('An error occurred when removing the function resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
