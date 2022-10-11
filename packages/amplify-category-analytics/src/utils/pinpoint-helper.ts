import {
  AmplifySupportedService,
  pathManager, readCFNTemplate,
  open, $TSAny, $TSContext, $TSMeta, AmplifyCategories,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { getAnalyticsResources } from './analytics-helper';

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
    open(consoleUrl, { wait: false });
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
  if (resources?.length > 0) {
    const pinpointCloudFormationTemplatePath = path.join(
      pathManager.getBackendDirPath(),
      AmplifyCategories.ANALYTICS,
      resources[0].resourceName,
      `pinpoint-cloudformation-template.json`,
    );
    const { cfnTemplate } = readCFNTemplate(pinpointCloudFormationTemplatePath, { throwIfNotExist: false }) || {};
    return !!cfnTemplate?.Parameters?.pinpointInAppMessagingPolicyName;
  }

  return false;
};
