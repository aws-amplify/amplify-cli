const inquirer = require('inquirer');
const _ = require('lodash');
const { stateManager, open } = require('amplify-cli-core');
const { getAuthResourceName } = require('../../utils/getAuthResourceName');
const { copyCfnTemplate, saveResourceParameters } = require('./utils/synthesize-resources');
const { ENV_SPECIFIC_PARAMS, AmplifyAdmin, UserPool, IdentityPool, BothPools, privateKeys } = require('./constants');
const { getAddAuthHandler, getUpdateAuthHandler } = require('./handlers/resource-handlers');
const { supportedServices } = require('../supported-services');
const { importResource, importedAuthEnvInit } = require('./import');

function serviceQuestions(context, defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, serviceMetadata) {
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);
  return serviceWalkthrough(context, defaultValuesFilename, stringMapsFilename, serviceMetadata);
}

async function addResource(context, service) {
  const serviceMetadata = supportedServices[service];
  const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename } = serviceMetadata;
  return getAddAuthHandler(context)(
    await serviceQuestions(context, defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, serviceMetadata),
  );
}

async function updateResource(context, { service }) {
  const serviceMetadata = supportedServices[service];
  const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename } = serviceMetadata;
  return getUpdateAuthHandler(context)(
    await serviceQuestions(context, defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, serviceMetadata),
  );
}

async function updateConfigOnEnvInit(context, category, service) {
  const srvcMetaData = supportedServices.Cognito;
  const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, provider } = srvcMetaData;

  const providerPlugin = context.amplify.getPluginInstance(context, provider);
  // previously selected answers
  const resourceParams = providerPlugin.loadResourceParameters(context, 'auth', service);
  // ask only env specific questions
  let currentEnvSpecificValues = context.amplify.loadEnvResourceParameters(context, category, service);

  const resource = _.get(context.exeInfo, ['amplifyMeta', category, service]);

  // Imported auth resource behavior is different from Amplify managed resources, as
  // they are immutable and all parameters and values are derived from the currently
  // cloud deployed values.
  if (resource && resource.serviceType === 'imported') {
    let envSpecificParametersResult;
    const { doServiceWalkthrough, succeeded, envSpecificParameters } = await importedAuthEnvInit(
      context,
      service,
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
      const importResult = await importResource(
        context,
        {
          providerName: provider,
          provider: undefined, // We don't have the resolved directory of the provider we pass in an instance
          service: 'Cognito',
        },
        resourceParams,
        providerPlugin,
        false,
      );

      if (importResult) {
        envSpecificParametersResult = importResult.envSpecificParameters;
      } else {
        throw new Error('There was an error importing the previously configured auth configuration to the new environment.');
      }
    } else if (succeeded) {
      envSpecificParametersResult = envSpecificParameters;
    } else {
      // succeeded === false | undefined
      throw new Error('There was an error importing the previously configured auth configuration to the new environment.');
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

      const cloudTimestamp = _.get(currentMeta, [category, service, 'lastPushTimeStamp'], undefined);

      if (cloudTimestamp) {
        resource.lastPushTimeStamp = cloudTimestamp;
      } else {
        resource.lastPushTimeStamp = new Date();
      }

      _.set(meta, [category, service, 'lastPushTimeStamp'], cloudTimestamp);
      stateManager.setMeta(undefined, meta);
    }

    return envSpecificParametersResult;
  }

  // legacy headless mode (only supports init)
  if (isInHeadlessMode(context)) {
    const envParams = {};
    let mergedValues;
    if (resourceParams.thirdPartyAuth || resourceParams.hostedUIProviderMeta) {
      const authParams = getHeadlessParams(context);
      const projectType = context.amplify.getProjectConfig().frontend;
      mergedValues = { ...resourceParams, ...authParams };
      const requiredParams = getRequiredParamsForHeadlessInit(projectType, resourceParams);
      const missingParams = [];
      requiredParams.forEach(p => {
        if (Object.keys(mergedValues).includes(p)) {
          envParams[p] = mergedValues[p];
        } else {
          missingParams.push(p);
        }
      });

      if (missingParams.length) {
        throw new Error(`auth headless is missing the following inputParams ${missingParams.join(', ')}`);
      }
    }
    if (resourceParams.hostedUIProviderMeta) {
      parseCredsForHeadless(mergedValues, envParams);
    }
    return envParams;
  }

  const { hostedUIProviderMeta } = resourceParams;

  if (hostedUIProviderMeta) {
    currentEnvSpecificValues = getOAuthProviderKeys(currentEnvSpecificValues, resourceParams);
  }
  const isPullingOrEnv =
    context.input.command === 'pull' ||
    (context.input.command === 'env' && context.input.subCommands && !context.input.subCommands.includes('add'));
  // don't ask for env_specific params when checking out env or pulling
  srvcMetaData.inputs = srvcMetaData.inputs.filter(
    input => ENV_SPECIFIC_PARAMS.includes(input.key) && !Object.keys(currentEnvSpecificValues).includes(input.key) && !isPullingOrEnv,
  );

  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  // interactive mode
  const result = await serviceWalkthrough(context, defaultValuesFilename, stringMapsFilename, srvcMetaData, resourceParams);
  let envParams = {};

  if (resourceParams.hostedUIProviderMeta) {
    envParams = formatCredsforEnvParams(currentEnvSpecificValues, result, resourceParams);
  }

  ENV_SPECIFIC_PARAMS.forEach(paramName => {
    if (paramName in result && paramName !== 'hostedUIProviderCreds' && privateKeys.indexOf(paramName) === -1) {
      envParams[paramName] = result[paramName];
    }
  });

  return envParams;
}

async function migrate(context) {
  const category = 'auth';
  const { amplify } = context;
  const existingAuth = context.migrationInfo.amplifyMeta.auth || {};
  if (!Object.keys(existingAuth).length > 0) {
    return;
  }
  const { provider, cfnFilename, defaultValuesFilename } = supportedServices.Cognito;
  const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;

  const { roles } = require(defaultValuesSrc);

  const providerInstance = amplify.getPluginInstance(context, provider);
  const resourceName = await getAuthResourceName(context);
  const props = providerInstance.loadResourceParameters(context, 'auth', resourceName);
  // Roles have changed to ref. Removing old hardcoded role ref
  Object.keys(roles).forEach(key => {
    delete props[key];
  });
  await copyCfnTemplate(context, category, props, cfnFilename);
  saveResourceParameters(context, provider, category, resourceName, { ...roles, ...props }, ENV_SPECIFIC_PARAMS);
}

function isInHeadlessMode(context) {
  return context.exeInfo.inputParams.yes;
}

function getHeadlessParams(context) {
  const { inputParams } = context.exeInfo;
  try {
    // If the input given is a string validate it using JSON parse
    const { categories = {} } = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams;
    return categories.auth || {};
  } catch (err) {
    throw new Error(`Failed to parse auth headless parameters: ${err}`);
  }
}

function getOAuthProviderKeys(currentEnvSpecificValues, resourceParams) {
  const oAuthProviders = JSON.parse(resourceParams.hostedUIProviderMeta).map(h => h.ProviderName);
  const { hostedUIProviderCreds = '[]' } = currentEnvSpecificValues;
  const configuredProviders = JSON.parse(hostedUIProviderCreds).map(h => h.ProviderName);
  const deltaProviders = _.intersection(oAuthProviders, configuredProviders);
  deltaProviders.forEach(d => {
    currentEnvSpecificValues[`${d.toLowerCase()}AppIdUserPool`] = configuredProviders[`${d.toLowerCase()}AppIdUserPool`];
    currentEnvSpecificValues[`${d.toLowerCase()}AppSecretUserPool`] = configuredProviders[`${d.toLowerCase()}AppSecretUserPool`];
  });
  return currentEnvSpecificValues;
}

function formatCredsforEnvParams(currentEnvSpecificValues, result, resourceParams) {
  const partialParams = {};
  if (currentEnvSpecificValues.hostedUIProviderCreds && result.hostedUIProviderCreds) {
    partialParams.hostedUIProviderCreds = [];
    const inputResult = JSON.parse(result.hostedUIProviderCreds);
    const previousResult = JSON.parse(currentEnvSpecificValues.hostedUIProviderCreds);
    if (resourceParams.hostedUIProviderMeta) {
      const currentProviders = JSON.parse(resourceParams.hostedUIProviderMeta).map(h => h.ProviderName);
      currentProviders.forEach(c => {
        const previousProvider = previousResult.find(p => p.ProviderName === c);
        const resultProvider = inputResult.find(r => r.ProviderName === c);
        partialParams.hostedUIProviderCreds.push(Object.assign(resultProvider, previousProvider));
      });
      partialParams.hostedUIProviderCreds = JSON.stringify(partialParams.hostedUIProviderCreds);
    }
  } else if (currentEnvSpecificValues.hostedUIProviderCreds && !result.hostedUIProviderCreds) {
    partialParams.hostedUIProviderCreds = currentEnvSpecificValues.hostedUIProviderCreds;
  } else if (!currentEnvSpecificValues.hostedUIProviderCreds && result.hostedUIProviderCreds) {
    partialParams.hostedUIProviderCreds = result.hostedUIProviderCreds;
  }
  return partialParams;
}

function parseCredsForHeadless(mergedValues, envParams) {
  const oAuthProviders = JSON.parse(mergedValues.hostedUIProviderMeta).map(h => h.ProviderName);
  envParams.hostedUIProviderCreds = JSON.stringify(
    oAuthProviders.map(el => ({
      ProviderName: el,
      client_id: mergedValues[`${el.toLowerCase()}AppIdUserPool`],
      client_secret: mergedValues[`${el.toLowerCase()}AppSecretUserPool`],
    })),
  );
  oAuthProviders.forEach(i => {
    delete envParams[`${i.toLowerCase()}AppIdUserPool`];
    delete envParams[`${i.toLowerCase()}AppSecretUserPool`];
  });
}

function getRequiredParamsForHeadlessInit(projectType, previousValues) {
  const requiredParams = [];

  if (previousValues.thirdPartyAuth) {
    if (previousValues.authProviders.includes('accounts.google.com')) {
      requiredParams.push('googleClientId');
      if (projectType === 'ios') {
        requiredParams.push('googleIos');
      }
      if (projectType === 'android') {
        requiredParams.push('googleAndroid');
      }
    }
    if (previousValues.authProviders.includes('graph.facebook.com')) {
      requiredParams.push('facebookAppId');
    }
    if (previousValues.authProviders.includes('www.amazon.com')) {
      requiredParams.push('amazonAppId');
    }
  }

  if (previousValues.hostedUIProviderMeta) {
    const oAuthProviders = JSON.parse(previousValues.hostedUIProviderMeta).map(h => h.ProviderName);
    if (oAuthProviders && oAuthProviders.length > 0) {
      oAuthProviders.forEach(o => {
        requiredParams.push(`${o.toLowerCase()}AppIdUserPool`);
        requiredParams.push(`${o.toLowerCase()}AppSecretUserPool`);
      });
    }
  }
  return requiredParams;
}

async function console(context, amplifyMeta) {
  const cognitoOutput = getCognitoOutput(amplifyMeta);
  if (cognitoOutput) {
    const { AmplifyAppId, Region } = amplifyMeta.providers.awscloudformation;
    if (cognitoOutput.UserPoolId && cognitoOutput.IdentityPoolId) {
      let choices = [UserPool, IdentityPool, BothPools];
      let isAdminApp = false;
      let region;
      if (AmplifyAppId) {
        const providerPlugin = require(context.amplify.getProviderPlugins(context).awscloudformation);
        const res = await providerPlugin.isAmplifyAdminApp(AmplifyAppId);
        isAdminApp = res.isAdminApp;
        region = res.region;
      }

      if (isAdminApp) {
        if (region !== Region) {
          context.print.warning(`Region mismatch: Amplify service returned '${region}', but found '${Region}' in amplify-meta.json.`);
        }
        if (!AmplifyAppId) {
          throw new Error('Missing AmplifyAppId in amplify-meta.json');
        }
        choices = [AmplifyAdmin, ...choices];
      }

      const answer = await inquirer.prompt({
        name: 'selection',
        type: 'list',
        message: 'Which console',
        choices,
        default: isAdminApp ? AmplifyAdmin : BothPools,
      });

      switch (answer.selection) {
        case AmplifyAdmin:
          await openAdminUI(context, AmplifyAppId, Region);
          break;
        case UserPool:
          await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
          break;
        case IdentityPool:
          await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
          break;
        case BothPools:
        default:
          await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
          await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
          break;
      }
    } else if (cognitoOutput.UserPoolId) {
      await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
    } else {
      await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
    }
    context.print.info('');
  } else {
    context.print.error('Amazon Cognito resources have NOT been created for your project.');
  }
}

function getCognitoOutput(amplifyMeta) {
  let cognitoOutput;
  const categoryMeta = amplifyMeta.auth;
  const services = Object.keys(categoryMeta);
  for (let i = 0; i < services.length; i += 1) {
    const serviceMeta = categoryMeta[services[i]];
    if (serviceMeta.service === 'Cognito' && serviceMeta.output && (serviceMeta.output.UserPoolId || serviceMeta.output.IdentityPoolId)) {
      cognitoOutput = serviceMeta.output;
      break;
    }
  }
  return cognitoOutput;
}

async function openAdminUI(context, appId, region) {
  const { envName } = context.amplify.getEnvInfo();
  const providerPlugin = require(context.amplify.getProviderPlugins(context).awscloudformation);
  const baseUrl = providerPlugin.adminBackendMap[region].amplifyAdminUrl;
  const adminUrl = `${baseUrl}/admin/${appId}/${envName}/auth`;
  await open(adminUrl, { wait: false });
  context.print.success(adminUrl);
}

async function openUserPoolConsole(context, region, userPoolId) {
  const userPoolConsoleUrl = `https://${region}.console.aws.amazon.com/cognito/users/?region=${region}#/pool/${userPoolId}/details`;
  await open(userPoolConsoleUrl, { wait: false });
  context.print.info('User Pool console:');
  context.print.success(userPoolConsoleUrl);
}

async function openIdentityPoolConsole(context, region, identityPoolId) {
  const identityPoolConsoleUrl = `https://${region}.console.aws.amazon.com/cognito/pool/?region=${region}&id=${identityPoolId}`;
  await open(identityPoolConsoleUrl, { wait: false });
  context.print.info('Identity Pool console:');
  context.print.success(identityPoolConsoleUrl);
}

function getPermissionPolicies(context, service, resourceName, crudOptions) {
  const { serviceWalkthroughFilename } = supportedServices[service];
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { getIAMPolicies } = require(serviceWalkthroughSrc);

  if (!getPermissionPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return;
  }

  return getIAMPolicies(context, resourceName, crudOptions);
}

module.exports = {
  addResource,
  updateResource,
  updateConfigOnEnvInit,
  migrate,
  console,
  getPermissionPolicies,
  importResource,
};
