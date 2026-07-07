import { $TSContext, $TSAny, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import * as pinpointHelper from './utils/pinpoint-helper';
import * as kinesisHelper from './utils/kinesis-helper';
import { migrationCheck } from './migrations';

export { migrate } from './provider-utils/awscloudformation/service-walkthroughs/pinpoint-walkthrough';

export {
  analyticsPluginAPIGetResources,
  analyticsPluginAPICreateResource,
  analyticsPluginAPIToggleNotificationChannel,
  analyticsPluginAPIPinpointHasInAppMessagingPolicy,
  analyticsGetPinpointRegionMapping,
  analyticsPluginAPIMigrations,
  analyticsPluginAPIPostPush,
  analyticsPluginAPIPush,
} from './analytics-resource-api';

const category = 'analytics';

/**
 * Command to open AWS console for kinesis/pinpoint
 * @param context amplify cli context
 */
export const console = async (context: $TSContext): Promise<void> => {
  const hasKinesisResource = kinesisHelper.hasResource(context);
  const hasPinpointResource = pinpointHelper.hasResource(context);

  let selectedResource;
  if (hasKinesisResource && hasPinpointResource) {
    selectedResource = await prompter.pick('Select resource', ['kinesis', 'pinpoint']);
  } else if (hasKinesisResource) {
    selectedResource = 'kinesis';
  } else if (hasPinpointResource) {
    selectedResource = 'pinpoint';
  } else {
    printer.error('Neither analytics nor notifications is enabled in the cloud.');
  }

  switch (selectedResource) {
    case 'kinesis':
      await kinesisHelper.console(context);
      break;
    case 'pinpoint':
      await pinpointHelper.console(context);
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
export const getPermissionPolicies = async (context: $TSContext, resourceOpsMapping: { [x: string]: $TSAny }): Promise<$TSAny> => {
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
      throw new AmplifyFault(
        'AnalyticsCategoryFault',
        {
          message: `Could not get policies for ${category}: ${resourceName}`,
        },
        e,
      );
    }
  }
  return { permissionPolicies, resourceAttributes };
};

/**
 * Execute the Amplify CLI command
 * @param context - Amplify CLI context
 */
export const executeAmplifyCommand = async (context: $TSContext): Promise<$TSAny> => {
  context.exeInfo = context.amplify.getProjectDetails();
  await migrationCheck(context);

  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  commandPath =
    context.input.command === 'help' ? path.join(commandPath, category) : path.join(commandPath, category, context.input.command);

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
