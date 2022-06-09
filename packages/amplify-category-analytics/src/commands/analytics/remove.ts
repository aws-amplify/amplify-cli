import {
  $TSAny, $TSContext, AmplifyCategories, IPluginAPIResponse,
} from 'amplify-cli-core';
import { checkResourceInUseByNotifications, invokeNotificationsAPIRecursiveRemoveApp } from '../../notifications-resource-api';

const subcommand = 'remove';
const category = 'analytics';
/**
 * Check if Notifications is using the given Analytics resource.
 * note:- TBD: This function will be replaced by a generic pre-remove hook handler in the future.
 * The eventual goal is to remove all explicit binding in the code between categories and abstract them out
 * by role (capabilities, providerCategory and subscriberCategory ).
 */
const removeResourceDependencies = async (context:$TSContext, resourceName: string): Promise<void> => {
  const isResourceInUse = await checkResourceInUseByNotifications(context, resourceName);
  if (isResourceInUse) {
    // Pinpoint App is in use by Notifications.
    context.print.warning(`Disabling all notifications on ${resourceName}`);
    const result:IPluginAPIResponse = await invokeNotificationsAPIRecursiveRemoveApp(context, resourceName);
    if (!result.status) {
      const errPrompt = `Failed to remove ${resourceName} from ${AmplifyCategories.NOTIFICATIONS} category`;
      const errMsg = (result.reasonMsg) || errPrompt;
      throw new Error(errMsg);
    }
  }
};

/**
 * Analytics remove resource handler.
 * @param context amplify cli context
 * @returns removeResource response
 */
export const run = async (context:$TSContext):Promise<$TSAny> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  return amplify.removeResource(context, category, resourceName, { headless: false },
    async selectedResourceName => removeResourceDependencies(context, selectedResourceName)) // callback to pre-process selected resource
    .catch(err => {
      context.print.info(err.stack);
      context.print.error('An error occurred when removing the analytics resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
};

module.exports = {
  name: subcommand,
  run,
};
