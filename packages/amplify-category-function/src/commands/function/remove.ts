import { category as categoryName } from '../../constants';
import { ServiceName } from '../../provider-utils/awscloudformation/utils/constants';
import { removeLayerArtifacts } from '../../provider-utils/awscloudformation/utils/storeResources';

const subcommand = 'remove';

module.exports = {
  name: subcommand,
  run: async context => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify
      .removeResource(context, categoryName, resourceName, {
        serviceDeletionInfo: {
          LambdaLayer:
            'When you delete a layer version, you can no longer configure functions to use it.\nHowever, any function that already uses the layer version continues to have access to it.',
        },
        serviceSuffix: { Lambda: '(function)', LambdaLayer: '(layer)', ElasticContainer: '(ecs)' },
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
