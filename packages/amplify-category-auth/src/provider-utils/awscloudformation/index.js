const inquirer = require('inquirer');
const open = require('open');
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const { getAuthResourceName } = require('../../utils/getAuthResourceName');
const { verificationBucketName } = require('./utils/verification-bucket-name');
const {
  copyCfnTemplate,
  removeDeprecatedProps,
  createUserPoolGroups,
  addAdminAuth,
  saveResourceParameters,
  lambdaTriggers,
  copyS3Assets,
} = require('./utils/synthesize-resources');
const { protectedValues, safeDefaults, ENV_SPECIFIC_PARAMS, privateKeys } = require('./constants');
const { getAddAuthHandler } = require('./handlers/get-add-auth-handler');

function serviceQuestions(context, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename, serviceMetadata) {
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);
  return serviceWalkthrough(context, defaultValuesFilename, stringMapFilename, serviceMetadata);
}

async function addResource(context, service) {
  const serviceMetadata = require('../supported-services').supportedServices[service];
  const { defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename } = serviceMetadata;
  return getAddAuthHandler(context)(
    await serviceQuestions(context, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename, serviceMetadata),
  );
}

// may be able to consolidate this into just createUserPoolGroups
async function updateUserPoolGroups(context, resourceName, userPoolGroupList) {
  if (userPoolGroupList && userPoolGroupList.length > 0) {
    const userPoolGroupPrecedenceList = [];

    for (let i = 0; i < userPoolGroupList.length; i += 1) {
      userPoolGroupPrecedenceList.push({
        groupName: userPoolGroupList[i],
        precedence: i + 1,
      });
    }

    const userPoolGroupFile = path.join(
      context.amplify.pathManager.getBackendDirPath(),
      'auth',
      'userPoolGroups',
      'user-pool-group-precedence.json',
    );

    fs.outputFileSync(userPoolGroupFile, JSON.stringify(userPoolGroupPrecedenceList, null, 4));

    context.amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', {
      service: 'Cognito-UserPool-Groups',
      providerPlugin: 'awscloudformation',
      dependsOn: [
        {
          category: 'auth',
          resourceName,
          attributes: ['UserPoolId', 'AppClientIDWeb', 'AppClientID', 'IdentityPoolId'],
        },
      ],
    });
  }
}

async function updateResource(context, category, serviceResult) {
  const { service, resourceName } = serviceResult;
  let props = {};
  const serviceMetadata = require('../supported-services').supportedServices[service];
  const { cfnFilename, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename, provider } = serviceMetadata;

  return serviceQuestions(context, defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename, serviceMetadata)
    .then(async result => {
      const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;
      const { functionMap } = require(defaultValuesSrc);
      const { authProviders } = require(`${__dirname}/assets/string-maps.js`);

      /* if user has used the default configuration,
       * we populate base choices like authSelections and resourceName for them */
      if (!result.authSelections) {
        result.authSelections = 'identityPoolAndUserPool';
      }

      const defaults = functionMap[result.authSelections](context.updatingAuth.resourceName);

      // removing protected values from results
      for (let i = 0; i < protectedValues.length; i += 1) {
        if (context.updatingAuth[protectedValues[i]]) {
          delete result[protectedValues[i]];
        }
      }

      if (result.useDefault && ['default', 'defaultSocial'].includes(result.useDefault)) {
        for (let i = 0; i < safeDefaults.length; i += 1) {
          delete context.updatingAuth[safeDefaults[i]];
        }
      }

      await verificationBucketName(result, context.updatingAuth);

      props = Object.assign(defaults, removeDeprecatedProps(context.updatingAuth), result);

      const resources = context.amplify.getProjectMeta();

      if (resources.auth.userPoolGroups) {
        await updateUserPoolGroups(context, props.resourceName, result.userPoolGroupList);
      } else {
        await createUserPoolGroups(context, props.resourceName, result.userPoolGroupList);
      }

      if (resources.api && resources.api.AdminQueries) {
        // Find Existing functionName
        let functionName;
        if (resources.api.AdminQueries.dependsOn) {
          const adminFunctionResource = resources.api.AdminQueries.dependsOn.find(
            resource => resource.category === 'function' && resource.resourceName.includes('AdminQueries'),
          );
          if (adminFunctionResource) {
            functionName = adminFunctionResource.resourceName;
          }
        }
        await addAdminAuth(context, props.resourceName, 'update', result.adminQueryGroup, functionName);
      } else {
        await addAdminAuth(context, props.resourceName, 'add', result.adminQueryGroup);
      }

      const providerPlugin = context.amplify.getPluginInstance(context, provider);
      const previouslySaved = providerPlugin.loadResourceParameters(context, 'auth', resourceName).triggers || '{}';
      await lambdaTriggers(props, context, JSON.parse(previouslySaved));

      if ((!result.updateFlow && !result.thirdPartyAuth) || (result.updateFlow === 'manual' && !result.thirdPartyAuth)) {
        delete props.selectedParties;
        delete props.authProviders;
        authProviders.forEach(a => {
          if (props[a.answerHashKey]) {
            delete props[a.answerHashKey];
          }
        });
        if (props.googleIos) {
          delete props.googleIos;
        }
        if (props.googleAndroid) {
          delete props.googleAndroid;
        }
        if (props.audiences) {
          delete props.audiences;
        }
      }

      if (props.useDefault === 'default' || props.hostedUI === false) {
        delete props.oAuthMetadata;
        delete props.hostedUIProviderMeta;
        delete props.hostedUIProviderCreds;
        delete props.hostedUIDomainName;
        delete props.authProvidersUserPool;
      }

      if (result.updateFlow !== 'updateUserPoolGroups' && result.updateFlow !== 'updateAdminQueries') {
        await copyCfnTemplate(context, category, props, cfnFilename);
        saveResourceParameters(context, provider, category, resourceName, props, ENV_SPECIFIC_PARAMS);
      }
    })
    .then(async () => {
      await copyS3Assets(context, props);
      return props.resourceName;
    });
}

async function updateConfigOnEnvInit(context, category, service) {
  const srvcMetaData = require('../supported-services').supportedServices.Cognito;
  const { defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename } = srvcMetaData;

  const providerPlugin = context.amplify.getPluginInstance(context, srvcMetaData.provider);
  // previously selected answers
  const resourceParams = providerPlugin.loadResourceParameters(context, 'auth', service);
  // ask only env specific questions
  let currentEnvSpecificValues = context.amplify.loadEnvResourceParameters(context, category, service);

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

  srvcMetaData.inputs = srvcMetaData.inputs.filter(
    input => ENV_SPECIFIC_PARAMS.includes(input.key) && !Object.keys(currentEnvSpecificValues).includes(input.key),
  );
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  // interactive mode
  const result = await serviceWalkthrough(context, defaultValuesFilename, stringMapFilename, srvcMetaData, resourceParams);
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
  const servicesMetadata = require('../supported-services').supportedServices;
  const { provider, cfnFilename, defaultValuesFilename } = servicesMetadata.Cognito;
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
    const { Region } = amplifyMeta.providers.awscloudformation;
    if (cognitoOutput.UserPoolId && cognitoOutput.IdentityPoolId) {
      const answer = await inquirer.prompt({
        name: 'selection',
        type: 'list',
        message: 'Which console',
        choices: ['User Pool', 'Identity Pool', 'Both'],
        default: 'Both',
      });

      switch (answer.selection) {
        case 'User Pool':
          await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
          break;
        case 'Identity Pool':
          await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
          break;
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

module.exports = {
  addResource,
  updateResource,
  updateConfigOnEnvInit,
  migrate,
  console,
  getPermissionPolicies,
};
