import {
  $TSContext, AmplifyCategories, amplifyFaultWithTroubleshootingLink,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { checkResourceInUseByNotifications, invokeNotificationsAPIRecursiveRemoveApp } from '../../plugin-client-api-notifications';

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
    printer.warn(`Disabling all notifications on ${resourceName}`);
    const result = await invokeNotificationsAPIRecursiveRemoveApp(context, resourceName);
    if (!result.status) {
      throw amplifyFaultWithTroubleshootingLink('ResourceRemoveFault', {
        message: result.reasonMsg || `Failed to remove ${resourceName} from ${AmplifyCategories.NOTIFICATIONS} category`,
      });
    }
  }
};

/**
 * Analytics remove resource handler.
 * @param context amplify cli context
 * @returns removeResource response
 */
export const run = async (context: $TSContext): Promise<void> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;

  await amplify.removeResource(context, category, resourceName, { headless: false });
  return removeResourceDependencies(context, resourceName);
};

export const name = subcommand;
