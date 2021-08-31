import { $TSAny, $TSContext, exitOnNextTick, JSONUtilities, NotImplementedError, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import _ from 'lodash';
import { importDynamoDB, importedDynamoDBEnvInit } from './import/import-dynamodb';
import { importedS3EnvInit, importS3 } from './import/import-s3';
export { importResource } from './import';

export async function addResource(context: $TSContext, category: string, service: string, options: $TSAny) {
  const serviceMetadata = ((await import('../supported-services')) as $TSAny).supportedServices[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { addWalkthrough } = await import(serviceWalkthroughSrc);

  return addWalkthrough(context, defaultValuesFilename, serviceMetadata, options).then(async (resourceName: string) => {
    context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);

    return resourceName;
  });
}

export async function updateResource(context: $TSContext, category: string, service: string) {
  const serviceMetadata = ((await import('../supported-services')) as $TSAny).supportedServices[service];
  const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { updateWalkthrough } = await import(serviceWalkthroughSrc);

  if (!updateWalkthrough) {
    const errMessage = 'Update functionality not available for this service';
    printer.error(errMessage);
    await context.usageData.emitError(new NotImplementedError(errMessage));
    exitOnNextTick(0);
  }

  return updateWalkthrough(context, defaultValuesFilename, serviceMetadata);
}

export async function migrateResource(context: $TSContext, projectPath: string, service: string, resourceName: string) {
  const serviceMetadata = ((await import('../supported-services')) as $TSAny).supportedServices[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { migrate } = await import(serviceWalkthroughSrc);

  if (!migrate) {
    printer.info(`No migration required for ${resourceName}`);
    return;
  }

  return migrate(context, projectPath, resourceName);
}

export async function getPermissionPolicies(service: string, resourceName: string, crudOptions: $TSAny) {
  const serviceMetadata = ((await import('../supported-services')) as $TSAny).supportedServices[service];
  const { serviceWalkthroughFilename } = serviceMetadata;
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { getIAMPolicies } = await import(serviceWalkthroughSrc);

  return getIAMPolicies(resourceName, crudOptions);
}

export async function updateConfigOnEnvInit(context: $TSContext, category: string, resourceName: string, service: string) {
  const serviceMetadata = ((await import('../supported-services')) as $TSAny).supportedServices[service];
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
        } as $TSAny,
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

function isInHeadlessMode(context: $TSContext) {
  return context.exeInfo.inputParams.yes;
}

function getHeadlessParams(context: $TSContext) {
  const { inputParams } = context.exeInfo;
  try {
    // If the input given is a string validate it using JSON parse
    const { categories = {} } = typeof inputParams === 'string' ? JSONUtilities.parse(inputParams) : inputParams;
    return categories.storage || {};
  } catch (err) {
    throw new Error(`Failed to parse storage headless parameters: ${err}`);
  }
}
