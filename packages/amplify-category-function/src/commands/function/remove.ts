import { JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import { category as categoryName } from '../../constants';
import { functionParametersFileName, ServiceName } from '../../provider-utils/awscloudformation/utils/constants';
import { removeLayerArtifacts } from '../../provider-utils/awscloudformation/utils/storeResources';
import * as path from 'path';
import {
  functionMayHaveSecrets,
  FunctionSecretsStateManager,
} from '../../provider-utils/awscloudformation/secrets/functionSecretsStateManager';

const subcommand = 'remove';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    // if the resource has not been pushed and it may have secrets in the cloud, we need to delete them now -- otherwise we will potentially orphan the secrets in the cloud
    const resourceNameCallback = async (resourceName: string) => {
      const isPushed = _.isEmpty(stateManager.getCurrentMeta()?.[categoryName]?.[resourceName]);
      const mayHaveSecrets = functionMayHaveSecrets(resourceName);
      if (!isPushed && mayHaveSecrets) {
        await (await FunctionSecretsStateManager.getInstance(context)).deleteAllFunctionSecrets(resourceName);
      }
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
      .then((resource: { service: string; resourceName: string }) => {
        if (resource.service === ServiceName.LambdaLayer) {
          removeLayerArtifacts(context, resource.resourceName);
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
