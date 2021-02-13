import { $TSContext } from 'amplify-cli-core';
import { buildFunction, BuildRequestMeta } from './buildFunction';
import { ServiceName } from './constants';

export const buildResource = (context: $TSContext, resource: BuildRequestMeta & { service: string }) => {
  // no build step for lambda layers
  if (resource.service === ServiceName.LambdaLayer) {
    return;
  }
  return buildFunction(context, resource);
};
