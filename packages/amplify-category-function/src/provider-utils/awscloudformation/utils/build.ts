import { $TSContext } from 'amplify-cli-core';
import { buildFunction, BuildRequestMeta } from './buildFunction';
import { ServiceName } from './constants';

export const buildResource = (context: $TSContext, resource: BuildRequestMeta & { service: string }) => {
  // only build lambda functions
  if (resource.service !== ServiceName.LambdaFunction) {
    return;
  }
  return buildFunction(context, resource);
};
