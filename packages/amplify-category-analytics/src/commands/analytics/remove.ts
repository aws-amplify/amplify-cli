import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { checkResourceInUseByNotifications } from '../../plugin-client-api-notifications';

const subcommand = 'remove';
const category = 'analytics';

export const name = subcommand;

/**
 * Analytics remove resource handler.
 * @param context amplify cli context
 * @returns removeResource response
 */
export const run = async (context: $TSContext): Promise<void> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;

  const throwIfUsedByNotifications = async (selectedAnalyticsResource: string): Promise<void> => {
    const isResourceInUse = await checkResourceInUseByNotifications(context, selectedAnalyticsResource);
    if (isResourceInUse) {
      throw new AmplifyError('ResourceInUseError', {
        message: `Analytics resource ${selectedAnalyticsResource} is being used by the notifications category and cannot be removed`,
        resolution: `Run 'amplify remove notifications', then retry removing analytics`,
      });
    }
  };

  // remove resource with a resourceName callback that will block removal if selecting an analytics resource that notifications depends on
  await amplify.removeResource(context, category, resourceName, { headless: false }, throwIfUsedByNotifications);
};
