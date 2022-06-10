/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { $TSAny, $TSContext } from 'amplify-cli-core';

import * as path from 'path';
import * as pinpointHelper from './pinpoint-helper';
import * as multiEnvManager from './multi-env-manager';
import { notificationsPluginAPIGetResource, notificationsPluginAPIRemoveApp } from './plugin-provider-api-notifications';

export {
  notificationsPluginAPIGetResource,
  notificationsPluginAPIRemoveApp,
} from './plugin-provider-api-notifications';

const category = 'notifications';

/**
 * Open the AWS console in the browser for the given service.
 * @param context amplify cli context
 */
export const notificationsConsole = async (context: $TSContext): Promise<void> => {
  pinpointHelper.channelInAppConsole(context);
};

/**
 * De-link all notifications resources from Pinpoint resource in the analytics category
 * @param context amplify cli context
 * @param envName amplify environment name
 */
export const deletePinpointAppForEnv = async (context: $TSContext, envName: string): Promise<void> => {
  await multiEnvManager.deletePinpointAppForEnv(context, envName);
};

/**
 * Initialize all notifications resources for this environment
 */
export const initEnv = async (context: $TSContext) : Promise<void> => {
  await multiEnvManager.initEnv(context);
};

/**
 * Execute the migration logic to help migrate older amplify notifications
 * resources to the current notifications resources.
 */
export const migrate = async (context:$TSContext):Promise<void> => {
  await multiEnvManager.migrate(context);
};

/**
 * Run the amplify command's handler function.
 */
export const executeAmplifyCommand = async (context: $TSContext): Promise<void> => {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }
  const commandModule = require(commandPath);
  await commandModule.run(context);
};

/**
 * Placeholder to handle notifications from other parts of the Amplify CLI.
 */
export const handleAmplifyEvent = async (context: $TSContext, args:$TSAny): Promise<void> => {
  context.print.info(`${category} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
};

module.exports = {
  console: notificationsConsole,
  deletePinpointAppForEnv,
  initEnv,
  migrate,
  executeAmplifyCommand,
  handleAmplifyEvent,
  notificationsPluginAPIGetResource,
  notificationsPluginAPIRemoveApp,
};
