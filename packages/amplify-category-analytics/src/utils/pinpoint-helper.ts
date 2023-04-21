import {
  AmplifySupportedService,
  pathManager,
  readCFNTemplate,
  open,
  $TSAny,
  $TSContext,
  $TSMeta,
  AmplifyCategories,
  stateManager,
  FeatureFlags,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as path from 'path';
import { getAnalyticsResources } from './analytics-helper';

/**
 * Pinpoint app type definition
 */
export type PinpointApp = {
  appId: string;
  appName: string;
};

export const pinpointInAppMessagingPolicyName = 'pinpointInAppMessagingPolicyName';

/**
 * opens resource in AWS console
 */
export const console = async (context: $TSContext): Promise<void> => {
  const amplifyMeta = context.amplify.getProjectMeta();
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS]);
  }
  if (pinpointApp) {
    const { Id, Region } = pinpointApp;
    const consoleUrl = `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/overview`;
    await open(consoleUrl, { wait: false });
  } else {
    printer.error('Neither analytics nor notifications is enabled in the cloud.');
  }
};

const scanCategoryMetaForPinpoint = (categoryMeta: $TSMeta): $TSAny => {
  let result: $TSAny;
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const service of services) {
      const serviceMeta = categoryMeta[service];
      if (serviceMeta.service === 'Pinpoint' && serviceMeta.output && serviceMeta.output.Id) {
        result = {
          Id: serviceMeta.output.Id,
        };
        if (serviceMeta.output.Name) {
          result.Name = serviceMeta.output.Name;
        } else if (serviceMeta.output.appName) {
          result.Name = serviceMeta.output.appName;
        }

        if (serviceMeta.output.Region) {
          result.Region = serviceMeta.output.Region;
        }
        break;
      }
    }
  }
  return result;
};

/**
 * checks if the project has a pinpoint resource
 */
export const hasResource = (context: $TSContext): boolean => {
  const amplifyMeta = context.amplify.getProjectMeta();
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS]);
  }

  return pinpointApp !== undefined;
};

/**
 * Checks if pinpoint has in app messaging policy
 */
export const pinpointHasInAppMessagingPolicy = (context: $TSContext): boolean => {
  const resources = getAnalyticsResources(context, AmplifySupportedService.PINPOINT);
  if (resources?.length === 0) {
    return false;
  }

  const pinpointCloudFormationTemplatePath = path.join(
    pathManager.getBackendDirPath(),
    AmplifyCategories.ANALYTICS,
    resources[0].resourceName,
    `pinpoint-cloudformation-template.json`,
  );
  const { cfnTemplate } = readCFNTemplate(pinpointCloudFormationTemplatePath, { throwIfNotExist: false }) || {};
  return !!cfnTemplate?.Parameters?.[pinpointInAppMessagingPolicyName];
};

/**
 * checks if notifications category has a pinpoint resource - legacy projects
 */
export const getNotificationsCategoryHasPinpointIfExists = (): PinpointApp | undefined => {
  const amplifyMeta = stateManager.getMeta();
  if (amplifyMeta.notifications) {
    const categoryResources = amplifyMeta.notifications;
    const pinpointServiceResource = Object.keys(categoryResources).find(
      (resource: string) =>
        categoryResources[resource].service === AmplifySupportedService.PINPOINT && categoryResources[resource].output.Id,
    );

    if (pinpointServiceResource) {
      return {
        appId: categoryResources[pinpointServiceResource].output.Id,
        appName: pinpointServiceResource,
      };
    }
  }

  return undefined;
};

/**
 * returns provider pinpoint region mapping
 */
export const getPinpointRegionMappings = async (): Promise<Record<string, $TSAny>> => {
  const Mappings: Record<string, $TSAny> = {
    RegionMapping: {},
  };
  const regionMapping = getPinpointRegionMapping();
  Object.keys(regionMapping).forEach((region) => {
    Mappings.RegionMapping[region] = {
      pinpointRegion: regionMapping[region],
    };
  });
  return Mappings;
};

export const getPinpointRegionMapping = (): { [key: string]: string } => {
  const latestPinpointRegions = FeatureFlags.getNumber('latestRegionSupport.pinpoint');

  return {
    'us-east-1': 'us-east-1',
    'us-east-2': latestPinpointRegions ? 'us-east-2' : 'us-east-1',
    'sa-east-1': 'us-east-1',
    'ca-central-1': latestPinpointRegions >= 1 ? 'ca-central-1' : 'us-east-1',
    'us-west-1': 'us-west-2',
    'us-west-2': 'us-west-2',
    'cn-north-1': 'us-west-2',
    'cn-northwest-1': 'us-west-2',
    'ap-south-1': latestPinpointRegions >= 1 ? 'ap-south-1' : 'us-east-1',
    'ap-northeast-3': 'us-west-2',
    'ap-northeast-2': latestPinpointRegions >= 1 ? 'ap-northeast-2' : 'us-east-1',
    'ap-southeast-1': latestPinpointRegions >= 1 ? 'ap-southeast-1' : 'us-east-1',
    'ap-southeast-2': latestPinpointRegions >= 1 ? 'ap-southeast-2' : 'us-east-1',
    'ap-northeast-1': latestPinpointRegions >= 1 ? 'ap-northeast-1' : 'us-east-1',
    'eu-central-1': 'eu-central-1',
    'eu-north-1': 'eu-central-1',
    'eu-south-1': 'eu-central-1',
    'eu-west-1': 'eu-west-1',
    'eu-west-2': latestPinpointRegions >= 1 ? 'eu-west-2' : 'eu-west-1',
    'eu-west-3': 'eu-west-1',
    'me-south-1': 'ap-south-1',
  };
};
