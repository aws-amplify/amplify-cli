import {
  $TSContext, $TSAny,
} from 'amplify-cli-core';
import * as path from 'path';
import inquirer, { QuestionCollection } from 'inquirer';
import { printer } from 'amplify-prompts';
import * as pinpointHelper from './utils/pinpoint-helper';
import * as kinesisHelper from './utils/kinesis-helper';
import { migrationCheck } from './migrations';

export { migrate } from './provider-utils/awscloudformation/service-walkthroughs/pinpoint-walkthrough';

export {
  analyticsPluginAPIGetResources,
  analyticsPluginAPICreateResource,
  analyticsPluginAPIToggleNotificationChannel,
  analyticsPluginAPIPinpointHasInAppMessagingPolicy,
  analyticsPluginAPIMigrations,
  analyticsPluginAPIPostPush,
  analyticsPluginAPIPush,
} from './analytics-resource-api';

const category = 'analytics';

/**
 * Command to open AWS console for kinesis/pinpoint
 * @param context amplify cli context
 */
export const console = async (context: $TSContext) : Promise<void> => {
  const hasKinesisResource = kinesisHelper.hasResource(context);
  const hasPinpointResource = pinpointHelper.hasResource(context);

  let selectedResource;
  if (hasKinesisResource && hasPinpointResource) {
    const question = {
      name: 'resource',
      message: 'Select resource',
      type: 'list',
      choices: ['kinesis', 'pinpoint'],
      required: true,
    };

    const result = await inquirer.prompt(question as QuestionCollection<{ [x: string]: unknown; }>);
    selectedResource = result.resource;
  } else if (hasKinesisResource) {
    selectedResource = 'kinesis';
  } else if (hasPinpointResource) {
    selectedResource = 'pinpoint';
  } else {
    printer.error('Neither analytics nor notifications is enabled in the cloud.');
  }

  switch (selectedResource) {
    case 'kinesis':
      kinesisHelper.console(context);
      break;
    case 'pinpoint':
      pinpointHelper.console(context);
      break;
    default:
      break;
  }
};

/**
 * Get Permission policies for CloudFormation
 * @param context cli context
 * @param resourceOpsMapping - get permission policies for each analytics resource
 */
export const getPermissionPolicies = async (context: $TSContext, resourceOpsMapping: { [x: string]: $TSAny; }): Promise<$TSAny> => {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies: $TSAny[] = [];
  const resourceAttributes: $TSAny[] = [];

  for (const resourceName of Object.keys(resourceOpsMapping)) {
    try {
      const providerName = amplifyMeta[category][resourceName].providerPlugin;
      if (providerName) {
        const providerController = await import(`./provider-utils/${providerName}/index`);
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          amplifyMeta[category][resourceName].service,
          resourceName,
          resourceOpsMapping[resourceName],
        );
        permissionPolicies.push(policy);
        resourceAttributes.push({ resourceName, attributes, category });
      } else {
        printer.error(`Provider not configured for ${category}: ${resourceName}`);
      }
    } catch (e) {
      printer.warn(`Could not get policies for ${category}: ${resourceName}`);
      throw e;
    }
  }
  return { permissionPolicies, resourceAttributes };
};

/**
 * Execute the Amplify CLI command
 * @param context - Amplify CLI context
 */
export const executeAmplifyCommand = async (context: $TSContext) : Promise<$TSAny> => {
  context.exeInfo = context.amplify.getProjectDetails();
  migrationCheck(context);

  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  commandPath = context.input.command === 'help'
    ? path.join(commandPath, category)
    : path.join(commandPath, category, context.input.command);

  const commandModule = await import(commandPath);
  await commandModule.run(context);
};

/**
 *  Placeholder for Amplify events
 *  @param __context amplify cli context
 *  @param args event handler arguments
 */
export const handleAmplifyEvent = async (__context: $TSContext, args: $TSAny): Promise<void> => {
  printer.info(`${category} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
};
