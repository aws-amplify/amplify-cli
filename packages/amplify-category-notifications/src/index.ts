import path from 'path';
import { $TSAny, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as pinpointHelper from './pinpoint-helper';
import * as multiEnvManager from './multi-env-manager';
import { migrationCheck } from './migrations';

export {
  notificationsPluginAPIGetResource,
  notificationsPluginAPIRemoveApp,
  notificationsAPIGetAvailableChannelNames,
} from './plugin-provider-api-notifications';

const category = 'notifications';

/**
 * Open the AWS console in the browser for the given service.
 * @param context amplify cli context
 */
export const console = async (context: $TSContext): Promise<void> => pinpointHelper.console(context);

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
export const initEnv = async (context: $TSContext): Promise<void> => {
  await multiEnvManager.initEnv(context);
};

/**
 * Execute the migration logic to help migrate older amplify notifications
 * resources to the current notifications resources.
 */
export const migrate = async (context: $TSContext): Promise<void> => {
  await multiEnvManager.migrate(context);
};

/**
 * Run the amplify command's handler function.
 */
export const executeAmplifyCommand = async (context: $TSContext): Promise<void> => {
  context.exeInfo = context.amplify.getProjectDetails();
  migrationCheck(context);

  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  commandPath = context.input.command === 'help' ? path.join(commandPath, category) : path.join(commandPath, category, context.input.command);
  const commandModule = await import(commandPath);
  await commandModule.run(context);
};

/**
 * Placeholder to handle notifications from other parts of the Amplify CLI.
 */
export const handleAmplifyEvent = (__context: $TSContext, args: $TSAny) : void => {
  printer.info(`${category} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
};
