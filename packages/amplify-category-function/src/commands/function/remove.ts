import { categoryName } from '../../constants';
import { ServiceName } from '../../provider-utils/awscloudformation/utils/constants';
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

    return amplify
      .removeResource(context, categoryName, resourceName)
      .then((resource: { service: string; resourceName: string }) => {
        if (resource?.service === ServiceName.LambdaLayer) {
          removeLayerArtifacts(context, resource.resourceName);
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
