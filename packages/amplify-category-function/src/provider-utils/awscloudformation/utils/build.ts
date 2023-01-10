import { $TSContext } from 'amplify-cli-core';
import { buildFunction, BuildRequestMeta } from './buildFunction';
import { buildLayer } from './buildLayer';
import { ServiceName } from './constants';

export const buildResource = (context: $TSContext, resource: BuildRequestMeta & { service: string }) => {
  // only build lambda functions and lambda layers
  if (resource.service !== ServiceName.LambdaFunction && resource.service !== ServiceName.LambdaLayer) {
    return undefined;
  }
  return getBuilderForService(resource.service)(context, resource);
};

// since lambdaLayers build is dfifferent from lambda function
const getBuilderForService = (service: string) => (service === ServiceName.LambdaLayer ? buildLayer : buildFunction);
