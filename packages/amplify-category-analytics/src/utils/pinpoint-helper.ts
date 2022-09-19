import {
  open, $TSAny, $TSContext, $TSMeta,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as constants from './constants';

/**
 * opens resource in AWS console
 */
export const console = (context: $TSContext): void => {
  const amplifyMeta = context.amplify.getProjectMeta();
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.NotificationsCategoryName]);
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
    for (let i = 0; i < services.length; i++) {
      const serviceMeta = categoryMeta[services[i]];
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
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.CategoryName]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[constants.NotificationsCategoryName]);
  }

  return pinpointApp !== undefined;
};
