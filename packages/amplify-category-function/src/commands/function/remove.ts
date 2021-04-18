import { category as categoryName } from '../../constants';
import { ServiceName } from '../../provider-utils/awscloudformation/utils/constants';
import { removeLayerArtifacts } from '../../provider-utils/awscloudformation/utils/storeResources';
import { removeResource } from '../../provider-utils/awscloudformation/service-walkthroughs/removeFunctionWalkthrough';
import { removeWalkthrough } from '../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough';
const subcommand = 'remove';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    let resourceName = parameters.first;
    const response = await removeResource(resourceName);
    let resourceToBeDeleted = '';
    if (response.isLambdaLayer) {
      context.print.info(
        'When you delete a layer version, you can no longer configure functions to use it.\nHowever, any function that already uses the layer version continues to have access to it.',
      );
      resourceToBeDeleted = await removeWalkthrough(context, response.resourceName);
      if (!resourceToBeDeleted) return;
      resourceName = resourceToBeDeleted;
    }
    console.log(resourceName);

    return amplify
      .removeResource(context, categoryName, resourceName)
      .then((resource: { service: string; resourceName: string }) => {
        if (resource?.service === ServiceName.LambdaLayer) {
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
