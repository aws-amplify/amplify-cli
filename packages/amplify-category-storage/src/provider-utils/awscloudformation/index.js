const _ = require('lodash');
import { stateManager, NotImplementedError, exitOnNextTick } from 'amplify-cli-core';
import { importS3, importedS3EnvInit } from './import/import-s3';
import { importDynamoDB, importedDynamoDBEnvInit } from './import/import-dynamodb';
export { importResource } from './import';

export function addResource(context, category, service, options) {
  const serviceMetadata = require('../supported-services').supportedServices[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { addWalkthrough } = require(serviceWalkthroughSrc);

  return addWalkthrough(context, defaultValuesFilename, serviceMetadata, options).then(async resourceName => {
    context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);

    return resourceName;
  });
}

export function updateResource(context, category, service) {
  const serviceMetadata = require('../supported-services').supportedServices[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = require(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    const errMessage = 'Update functionality not available for this service';
    context.print.error(errMessage);
    context.usageData.emitError(new NotImplementedError(errMessage));
    exitOnNextTick(0);
  }

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata);
}

export function migrateResource(context, projectPath, service, resourceName) {
  const serviceMetadata = require('../supported-services').supportedServices[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { migrate } = require(serviceWalkthroughSrc);

  if (!migrate) {
    context.print.info(`No migration required for ${resourceName}`);
    return;
  }

  return migrate(context, projectPath, resourceName);
}

export function getPermissionPolicies(context, service, resourceName, crudOptions) {
  const serviceMetadata = require('../supported-services').supportedServices[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { getIAMPolicies } = require(serviceWalkthroughSrc);

  if (!getPermissionPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return getIAMPolicies(resourceName, crudOptions);
}

export async function updateConfigOnEnvInit(context, category, resourceName, service) {
  const serviceMetadata = require('../supported-services').supportedServices[service];
  const { provider } = serviceMetadata;

  const providerPlugin = context.amplify.getPluginInstance(context, provider);
  // previously selected answers
  const resourceParams = providerPlugin.loadResourceParameters(context, category, resourceName);
  // ask only env specific questions
  let currentEnvSpecificValues = context.amplify.loadEnvResourceParameters(context, category, resourceName);

  const resource = _.get(context.exeInfo, ['amplifyMeta', category, resourceName]);

  // Imported auth resource behavior is different from Amplify managed resources, as
  // they are immutable and all parameters and values are derived from the currently
  // cloud deployed values.
  if (resource && resource.serviceType === 'imported') {
    let envSpecificParametersResult;

    const envInitFunction = service === 'S3' ? importedS3EnvInit : importedDynamoDBEnvInit;

    const { doServiceWalkthrough, succeeded, envSpecificParameters } = await envInitFunction(
      context,
      resourceName,
      resource,
      resourceParams,
      provider,
      providerPlugin,
      currentEnvSpecificValues,
      isInHeadlessMode(context),
      isInHeadlessMode(context) ? getHeadlessParams(context) : {},
    );

    // No need for headless check as this will never be true for headless
    if (doServiceWalkthrough === true) {
      const importFunction = service === 'S3' ? importS3 : importDynamoDB;
      const importResult = await importFunction(
        context,
        {
          providerName: provider,
          provider: undefined, // We don't have the resolved directory of the provider we pass in an instance
          service, // S3 | DynamoDB
        },
        resourceParams,
        providerPlugin,
        false,
      );

      if (importResult) {
        envSpecificParametersResult = importResult.envSpecificParameters;
      } else {
        throw new Error('There was an error importing the previously configured storage configuration to the new environment.');
      }
    } else if (succeeded) {
      envSpecificParametersResult = envSpecificParameters;
    } else {
      // succeeded === false | undefined
      throw new Error('There was an error importing the previously configured storage configuration to the new environment.');
    }

    // If the imported resource was synced up to the cloud before, copy over the timestamp since frontend generation
    // and other pieces of the CLI could rely on the presence of a value, if no timestamp was found for the same
    // resource, then do nothing as push will assign one.
    const currentMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
    });

    if (currentMeta) {
      const meta = stateManager.getMeta(undefined, {
        throwIfNotExist: false,
      });

      const cloudTimestamp = _.get(currentMeta, [category, resourceName, 'lastPushTimeStamp'], undefined);

      if (cloudTimestamp) {
        resource.lastPushTimeStamp = cloudTimestamp;
      } else {
        resource.lastPushTimeStamp = new Date();
      }

      _.set(meta, [category, resourceName, 'lastPushTimeStamp'], cloudTimestamp);
      stateManager.setMeta(undefined, meta);
    }

    return envSpecificParametersResult;
  }
}

function isInHeadlessMode(context) {
  return context.exeInfo.inputParams.yes;
}

function getHeadlessParams(context) {
  const { inputParams } = context.exeInfo;
  try {
    // If the input given is a string validate it using JSON parse
    const { categories = {} } = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams;
    return categories.storage || {};
  } catch (err) {
    throw new Error(`Failed to parse storage headless parameters: ${err}`);
  }
}
