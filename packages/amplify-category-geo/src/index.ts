import { $TSContext, $TSObject, stateManager, exitOnNextTick, $TSAny } from 'amplify-cli-core';
import { category } from './constants';
import * as addCommand from './commands/geo/add';
import * as updateCommand from './commands/geo/update';
import * as removeCommand from './commands/geo/remove';
import * as consoleCommand from './commands/geo/console';
import * as helpCommand from './commands/geo/help';
import { getServicePermissionPolicies } from './service-utils/resourceUtils';
import { ServiceName } from './service-utils/constants';
import { printer } from 'amplify-prompts';
import { addResourceHeadless } from './provider-controllers';

export const executeAmplifyCommand = async (context: $TSContext) => {
  switch (context.input.command) {
    case 'add':
      await addCommand.run(context);
      break;
    case 'update':
      await updateCommand.run(context);
      break;
    case 'remove':
      await removeCommand.run(context);
      break;
    case 'console':
      await consoleCommand.run(context);
      break;
    case 'help':
      await helpCommand.run(context);
      break;
    default:
      printer.error(`The subcommand ${context.input.command} is not supported for ${category} category`);
      break;
  }
};

export const handleAmplifyEvent = async (context: $TSContext, args: $TSAny) => {
  printer.info(`${category} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
};

export const getPermissionPolicies = (context: $TSContext, resourceOpsMapping: $TSObject) => {
  const amplifyMeta = stateManager.getMeta()?.[category];
  const permissionPolicies: $TSObject[] = [];
  const resourceAttributes: $TSObject[] = [];

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    try {
      const service: ServiceName = amplifyMeta[resourceName].service as ServiceName;

      const { policy, attributes } = getServicePermissionPolicies(context, service, resourceName, resourceOpsMapping[resourceName]);
      if (Array.isArray(policy)) {
        permissionPolicies.push(...policy);
      } else {
        permissionPolicies.push(policy);
      }
      resourceAttributes.push({ resourceName, attributes, category });
    } catch (e) {
      printer.error(`Could not get policies for ${category}: ${resourceName}`);
      throw e;
    }
  });

    return { permissionPolicies, resourceAttributes };
}

/**
 * Entry point for headless commands
 * @param {any} context The amplify context object
 * @param {string} headlessPayload The serialized payload from the platform
 */
 export const executeAmplifyHeadlessCommand = async (context: $TSContext, headlessPayload: string) => {
  switch (context.input.command) {
    case 'add':
    case 'update':
      console.log(headlessPayload);
      await addResourceHeadless(context, headlessPayload);
      break;
    default:
      printer.error(`Headless mode for ${context.input.command} codegen is not implemented yet`);
  }
};
