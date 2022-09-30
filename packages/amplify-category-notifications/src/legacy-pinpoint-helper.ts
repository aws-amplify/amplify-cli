/* eslint-disable max-depth */
/* eslint-disable no-param-reassign */
/* eslint-disable import/no-dynamic-require */
import {
  $TSAny, $TSContext, AmplifyCategories, AmplifySupportedService,
} from 'amplify-cli-core';

import ora from 'ora';
import { printer, prompter } from 'amplify-prompts';
import * as authHelper from './auth-helper';

const providerName = 'awscloudformation';
const spinner = ora('');

/**
 * Legacy function to get the pinpoint app.
 * @param context amplify cli context
 * @returns pinpoint app id
 */
export const getPinpointApp = (context: $TSContext):$TSAny => {
  const { amplifyMeta } = context.exeInfo;
  const pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS]);
  if (!pinpointApp) {
    return scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS]);
  }
  return pinpointApp;
};

/**
 * Legacy function to ensure pinpoint app is created
 * @param context amplify cli context
 * @param pinpointNotificationsMeta pinpoint app meta
 */
export const ensurePinpointApp = async (context: $TSContext, pinpointNotificationsMeta: $TSAny): Promise<void> => {
  let pinpointApp;
  let resourceName;
  const { amplifyMeta, localEnvInfo } = context.exeInfo;

  if (pinpointNotificationsMeta) {
    if (
      pinpointNotificationsMeta.service === AmplifySupportedService.PINPOINT
      && pinpointNotificationsMeta.output
      && pinpointNotificationsMeta.output.Id
    ) {
      resourceName = pinpointNotificationsMeta.resourceName
        ? pinpointNotificationsMeta.resourceName
        : generateResourceName(pinpointNotificationsMeta.Name, localEnvInfo.envName);

      pinpointApp = pinpointNotificationsMeta.output;
      constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
    } else {
      resourceName = pinpointNotificationsMeta.resourceName; //eslint-disable-line
    }
  }

  if (!pinpointApp) {
    const scanOptions: $TSAny = {
      isRegulatingResourceName: true,
      envName: localEnvInfo.envName,
    };

    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], scanOptions);
    if (pinpointApp) {
      resourceName = scanOptions.regulatedResourceName;
    }
  }

  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS]);
    if (pinpointApp) {
      resourceName = generateResourceName(pinpointApp.Name, localEnvInfo.envName);
      constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
    }
  }

  if (!pinpointApp) {
    printer.blankLine();
    resourceName = await createPinpointApp(context, resourceName);
  }

  context.exeInfo.serviceMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName];
  context.exeInfo.pinpointApp = context.exeInfo.serviceMeta.output;
};

// resource name is consistent cross environments
const generateResourceName = (pinpointAppName: string, envName: string):string => pinpointAppName.replace(getEnvTagPattern(envName), '');

const generatePinpointAppName = (resourceName: string, envName: string):string => resourceName + getEnvTagPattern(envName);

const getEnvTagPattern = (envName: string): string => (envName === 'NONE' ? '' : `-${envName}`);

/**
 * Legacy code to create pinpoint app using Pinpoint SDK
 * @param context amplify cli context
 * @param resourceName pinpoint app resource name
 * @returns pinpoint app name
 */
const createPinpointApp = async (context: $TSContext, resourceName:string): Promise<string> => {
  const { projectConfig, amplifyMeta, localEnvInfo } = context.exeInfo;

  printer.info('An Amazon Pinpoint project will be created for notifications.');
  if (!resourceName) {
    resourceName = projectConfig.projectName + context.amplify.makeId(5);
    if (!context.exeInfo.inputParams || !context.exeInfo.inputParams.yes) {
      resourceName = await prompter.input('Provide your pinpoint resource name: ', {
        validate: (name: $TSAny):$TSAny => {
          let result = false;
          let message = '';
          if (name && name.length > 0) {
            result = true;
          } else {
            message = 'Your pinpoint resource name can not be empty.';
          }
          return result || message;
        },
        initial: resourceName,
      });
    }
  }

  const pinpointAppName = generatePinpointAppName(resourceName, localEnvInfo.envName);
  const pinpointApp = await createApp(context, pinpointAppName);
  constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
  context.exeInfo.pinpointApp = pinpointApp; // needed for authHelper.ensureAuth(context);

  printer.blankLine();
  await authHelper.ensureAuth(context, resourceName);
  printer.blankLine();

  return resourceName;
};

const constructResourceMeta = (amplifyMeta: $TSAny, resourceName: string, pinpointApp:$TSAny):void => {
  amplifyMeta[AmplifyCategories.NOTIFICATIONS] = amplifyMeta[AmplifyCategories.NOTIFICATIONS] || {};
  amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName] = {
    service: AmplifySupportedService.PINPOINT,
    output: pinpointApp,
    lastPushTimeStamp: new Date(),
  };
};

/**
 * Delete the pinpoint app
 */
export const deletePinpointApp = async (context: $TSContext): Promise<void> => {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS]);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS]);
  }
  if (pinpointApp) {
    await authHelper.deleteRolePolicy(context);
    pinpointApp = await deleteApp(context, pinpointApp.Id);
    removeCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], pinpointApp.Id);
    removeCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], pinpointApp.Id);
  }
};

/**
 *  Legacy function to scan amplifyMeta for pinpoint app
 * @param categoryMeta {$TSAny} category section of amplify-meta
 * @param options scan options
 * @returns pinpointApp data
 */
const scanCategoryMetaForPinpoint = (categoryMeta: $TSAny, options?: $TSAny):$TSAny => {
  let result: $TSAny;
  if (categoryMeta) {
    let resourceName;
    const resources = Object.keys(categoryMeta);
    for (const resource of resources) {
      resourceName = resource;
      const serviceMeta = categoryMeta[resourceName];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT && serviceMeta.output && serviceMeta.output.Id) {
        result = {
          Id: serviceMeta.output.Id,
        };
        result.Name = serviceMeta.output.Name || serviceMeta.output.appName;
        result.Region = serviceMeta.output.Region;

        if (options?.isRegulatingResourceName) {
          const regulatedResourceName = generateResourceName(result.Name, options.envName);
          options.regulatedResourceName = regulatedResourceName;
          if (resourceName !== regulatedResourceName) {
            categoryMeta[regulatedResourceName] = serviceMeta;
            delete categoryMeta[resourceName];
          }
        }
        break;
      }
    }
  }

  return result;
};

const removeCategoryMetaForPinpoint = (categoryMeta: $TSAny, pinpointAppId: string) : $TSAny => {
  let result;
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const service of services) {
      const serviceMeta = categoryMeta[service];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT && serviceMeta.output && serviceMeta.output.Id === pinpointAppId) {
        delete categoryMeta[service];
      }
    }
  }
  return result;
};

const getPinpointClient = async (context: $TSContext, action: string, envName?: string):Promise<$TSAny> => {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = await import(providerPlugins[providerName]);
  return provider.getConfiguredPinpointClient(context, AmplifyCategories.NOTIFICATIONS, action, envName);
};

const createApp = async (context: $TSContext, pinpointAppName:string): Promise<$TSAny> => {
  const params = {
    CreateApplicationRequest: {
      Name: pinpointAppName,
    },
  };
  const pinpointClient = await getPinpointClient(context, 'create');
  spinner.start('Creating Pinpoint app.');

  try {
    const data = await pinpointClient.createApp(params).promise();
    spinner.succeed(`Successfully created Pinpoint project: ${data.ApplicationResponse.Name}`);
    data.ApplicationResponse.Region = pinpointClient.config.region;
    return data.ApplicationResponse;
  } catch (e) {
    spinner.fail('Pinpoint project creation error');
    throw e;
  }
};

const deleteApp = async (context: $TSContext, pinpointAppId: string): Promise<$TSAny> => {
  const params: $TSAny = {
    ApplicationId: pinpointAppId,
  };
  const pinpointClient = await getPinpointClient(context, 'delete');
  spinner.start('Deleting Pinpoint app.');

  try {
    const data = await pinpointClient.deleteApp(params).promise();
    spinner.succeed(`Successfully deleted Pinpoint project: ${data.ApplicationResponse.Name}`);
    data.ApplicationResponse.Region = pinpointClient.config.region;
    return data.ApplicationResponse;
  } catch (err) {
    if (err && err.code === 'NotFoundException') {
      spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
      return {
        Id: params.ApplicationId,
      };
    }

    spinner.fail('Pinpoint project deletion error');
    throw err;
  }
};

/**
 * Legacy function to check if analytics is enabled in the cloud
 * @param context amplify cli context
 * @returns true if analytics is enabled in the cloud, false otherwise
 */
export const isAnalyticsAdded = (context: $TSContext): boolean => {
  const { amplifyMeta } = context.exeInfo;
  const pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS]);
  if (pinpointApp) {
    return true;
  }
  return false;
};
