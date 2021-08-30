export const name = 'remove';
const category = 'auth';
import { $TSContext, stateManager } from 'amplify-cli-core';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';

export const run = async (context: $TSContext) => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  const meta = stateManager.getMeta();
  const dependentResources = Object.keys(meta).some(e => {
    return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
  });
  if (dependentResources) {
    context.print.info(messages.dependenciesExists);
  }

  try {
    return await amplify.removeResource(context, category, resourceName);
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('There was an error removing the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
