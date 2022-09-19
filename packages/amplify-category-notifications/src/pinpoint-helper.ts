import {
  $TSAny, $TSContext, $TSMeta, AmplifyCategories, AmplifySupportedService, open, stateManager,
} from 'amplify-cli-core';

import inquirer from 'inquirer';
import ora from 'ora';

import { printer } from 'amplify-prompts';
import { deleteRolePolicy, ensureAuth } from './auth-helper';
import { ICategoryMeta } from './notifications-types';

const providerName = 'awscloudformation';
const spinner = ora('');

/**
 * Get the Pinpoint app from analytics category
 */
export const getPinpointApp = (context: $TSContext): ICategoryMeta | undefined => {
  const { amplifyMeta } = context.exeInfo;
  const pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], undefined);
  if (!pinpointApp) {
    return scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
  }
  return pinpointApp;
};

/**
 * Ensure Pinpoint app exists
 */
export const ensurePinpointApp = async (context: $TSContext, pinpointNotificationsMeta: $TSMeta): Promise<void> => {
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
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
    if (pinpointApp) {
      resourceName = generateResourceName(pinpointApp.Name, localEnvInfo.envName);
      constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
    }
  }

  if (!pinpointApp) {
    printer.info('');
    resourceName = await createPinpointApp(context, resourceName);
  }

  context.exeInfo.serviceMeta = context.exeInfo.amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName];
  context.exeInfo.pinpointApp = context.exeInfo.serviceMeta.output;
};

// resource name is consistent cross environments
const generateResourceName = (pinpointAppName: string, envName: string): string => pinpointAppName.replace(getEnvTagPattern(envName), '');

const generatePinpointAppName = (resourceName: string, envName: string): string => resourceName + getEnvTagPattern(envName);

const getEnvTagPattern = (envName: string): string => (envName === 'NONE' ? '' : `-${envName}`);

const createPinpointApp = async (context: $TSContext, resourceName: string): Promise<string> => {
  const { projectConfig, amplifyMeta, localEnvInfo } = context.exeInfo;

  printer.info('An Amazon Pinpoint project will be created for notifications.');
  if (!resourceName) {
    // eslint-disable-next-line no-param-reassign
    resourceName = projectConfig.projectName + context.amplify.makeId(5);
    if (!context.exeInfo.inputParams || !context.exeInfo.inputParams.yes) {
      const answer = await inquirer.prompt({
        name: 'resourceNameInput',
        type: 'input',
        message: 'Provide your pinpoint resource name: ',
        default: resourceName,
        validate: name => {
          let result = false;
          let message = '';
          if (name && name.length > 0) {
            result = true;
          } else {
            message = 'Your pinpoint resource name can not be empty.';
          }
          return result || message;
        },
      });
      // eslint-disable-next-line no-param-reassign
      resourceName = answer.resourceNameInput;
    }
  }

  const pinpointAppName = generatePinpointAppName(resourceName, localEnvInfo.envName);
  const pinpointApp = await createApp(context, pinpointAppName);
  constructResourceMeta(amplifyMeta, resourceName, pinpointApp);
  context.exeInfo.pinpointApp = pinpointApp; // needed for authHelper.ensureAuth(context);

  printer.info('');
  await ensureAuth(context, resourceName);
  printer.info('');

  return resourceName;
};

const constructResourceMeta = (amplifyMeta: $TSMeta, resourceName: string, pinpointApp: $TSAny): void => {
  // eslint-disable-next-line no-param-reassign
  amplifyMeta[AmplifyCategories.NOTIFICATIONS] = amplifyMeta[AmplifyCategories.NOTIFICATIONS] || {};
  // eslint-disable-next-line no-param-reassign
  amplifyMeta[AmplifyCategories.NOTIFICATIONS][resourceName] = {
    service: AmplifySupportedService.PINPOINT,
    output: pinpointApp,
    lastPushTimeStamp: new Date(),
  };
};

/**
 * Delete Pinpoint App
 */
export const deletePinpointApp = async (context: $TSContext): Promise<void> => {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp: ICategoryMeta | undefined = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], undefined);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
  }
  if (pinpointApp) {
    await deleteRolePolicy(context);
    pinpointApp = await deleteApp(context, pinpointApp.Id) as ICategoryMeta;
    removeCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], pinpointApp.Id);
    removeCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], pinpointApp.Id);
  }
};

/**
 * Scan AmplifyMeta for given category (Legacy - needs refactor)
 * @param categoryMeta - CategoryMeta is updated if CLI is regulating pinpoint resource name
 * @param options - amplify cli options
 */
export const scanCategoryMetaForPinpoint = (categoryMeta: $TSAny, options: $TSAny): ICategoryMeta | undefined => {
  let result: ICategoryMeta | undefined;
  if (categoryMeta) {
    let resourceName;
    const resources = Object.keys(categoryMeta);
    for (const resource of resources) {
      resourceName = resource;
      const serviceMeta = categoryMeta[resourceName];
      if (serviceMeta.service === AmplifySupportedService.PINPOINT && serviceMeta.output && serviceMeta.output.Id) {
        result = {
          Id: serviceMeta.output.Id,
          Name: serviceMeta.output.Name || serviceMeta.output.appName,
          Region: serviceMeta.output.Region,
        };

        if (options && options.isRegulatingResourceName) {
          const regulatedResourceName = generateResourceName(result.Name, options.envName);
          // eslint-disable-next-line no-param-reassign
          options.regulatedResourceName = regulatedResourceName;
          // eslint-disable-next-line max-depth
          if (resourceName !== regulatedResourceName) {
            // eslint-disable-next-line no-param-reassign
            categoryMeta[regulatedResourceName] = serviceMeta;
            // eslint-disable-next-line no-param-reassign
            delete categoryMeta[resourceName];
          }
        }

        break;
      }
    }
  }

  return result;
};

const removeCategoryMetaForPinpoint = (categoryMeta: $TSAny, pinpointAppId: string) : void => {
  if (categoryMeta) {
    const services = Object.keys(categoryMeta);
    for (const service of services) {
      const serviceMeta = categoryMeta[service];
      if (serviceMeta.service === 'Pinpoint' && serviceMeta.output && serviceMeta.output.Id === pinpointAppId) {
        // eslint-disable-next-line no-param-reassign
        delete categoryMeta[service];
      }
    }
  }
};

const createApp = async (context: $TSContext, pinpointAppName: string): Promise<$TSAny> => {
  const params = {
    CreateApplicationRequest: {
      Name: pinpointAppName,
    },
  };
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const pinpointClient = await getPinpointClient(context, 'create', envName);
  spinner.start('Creating Pinpoint app.');
  return new Promise((resolve, reject) => {
    pinpointClient.createApp(params, (err: $TSAny, data: $TSAny) => {
      if (err) {
        spinner.fail('Pinpoint project creation error');
        reject(err);
      } else {
        spinner.succeed(`Successfully created Pinpoint project: ${data.ApplicationResponse.Name}`);
        // eslint-disable-next-line no-param-reassign
        data.ApplicationResponse.Region = pinpointClient.config.region;
        resolve(data.ApplicationResponse);
      }
    });
  });
};

const deleteApp = async (context : $TSContext, pinpointAppId : string) : Promise<$TSAny> => {
  const params = {
    ApplicationId: pinpointAppId,
  };
  const envName: string = stateManager.getCurrentEnvName() as string; // throws exception if env is not configured
  const pinpointClient = await getPinpointClient(context, 'delete', envName);
  spinner.start('Deleting Pinpoint app.');
  return new Promise((resolve, reject) => {
    pinpointClient.deleteApp(params, (err: $TSAny, data: $TSAny) => {
      if (err && err.code === 'NotFoundException') {
        spinner.succeed(`Project with ID '${params.ApplicationId}' was already deleted from the cloud.`);
        resolve({
          Id: params.ApplicationId,
        });
      } else if (err) {
        spinner.fail('Pinpoint project deletion error');
        reject(err);
      } else {
        spinner.succeed(`Successfully deleted Pinpoint project: ${data.ApplicationResponse.Name}`);
        // eslint-disable-next-line no-param-reassign
        data.ApplicationResponse.Region = pinpointClient.config.region;
        resolve(data.ApplicationResponse);
      }
    });
  });
};

/**
 * Open the AWS console in the browser for the given service.
 */
export const console = (context: $TSContext): void => {
  const { amplifyMeta } = context.exeInfo;
  let pinpointApp: $TSAny = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.NOTIFICATIONS], undefined);
  if (!pinpointApp) {
    pinpointApp = scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
  }
  if (pinpointApp) {
    const { Id, Region } = pinpointApp;
    const consoleUrl = `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/settings`;
    open(consoleUrl, { wait: false });
  } else {
    printer.error('Neither notifications nor analytics is enabled in the cloud.');
  }
};

/**
 * Get Pinpoint client from cloudformation
 */
export const getPinpointClient = async (context : $TSContext, action: string, envName: string) : Promise<$TSAny> => {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const provider = require(providerPlugins[providerName]);
  return provider.getConfiguredPinpointClient(context, AmplifyCategories.NOTIFICATIONS, action, envName);
};

/**
 * Check if Analytics has been enabled
 */
export const isAnalyticsAdded = (context: $TSContext): boolean => {
  const { amplifyMeta } = context.exeInfo;
  return !!scanCategoryMetaForPinpoint(amplifyMeta[AmplifyCategories.ANALYTICS], undefined);
};
