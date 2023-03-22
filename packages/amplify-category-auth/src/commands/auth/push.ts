import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { uploadFiles } from '../../provider-utils/awscloudformation/utils/trigger-file-uploader';

export const name = 'push';
const category = 'auth';

/**
 * entry point for the auth push
 */
export const run = async (context: $TSContext): Promise<$TSAny> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  context.amplify.constructExeInfo(context);
  const result = await amplify.pushResources(context, category, resourceName);
  await uploadFiles(context);
  return result;
};
