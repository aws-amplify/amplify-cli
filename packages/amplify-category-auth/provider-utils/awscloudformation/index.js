const fs = require('fs');
const inquirer = require('inquirer');
const opn = require('opn');

let serviceMetadata;

// Todo: move these to supported service.json

const ENV_SPECIFIC_PARAMS = [
  'facebookAppId',
  'googleClientId',
  'googleIos',
  'googleAndroid',
  'amazonAppId',
  'hostedUIProviderCreds',
];

const privateKeys = [
  'facebookAppIdUserPool',
  'facebookAuthorizeScopes',
  'facebookAppSecretUserPool',
  'googleClientIdUserPool',
  'googleAuthorizeScopes',
  'googleAppSecretUserPool',
  'amazonAppSecretUserPool',
  'amazonAuthorizeScopes',
  'amazonAppSecretUserPool',
  'CallbackURLs',
  'LogoutURLs',
  'AllowedOAuthFlows',
  'AllowedOAuthScopes',
  'EditURLS',
  'newCallbackURLs',
  'addCallbackOnUpdate',
  'updateFlow',
];

function serviceQuestions(
  context,
  defaultValuesFilename,
  stringMapFilename,
  serviceWalkthroughFilename,
) {
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  return serviceWalkthrough(context, defaultValuesFilename, stringMapFilename, serviceMetadata);
}

async function copyCfnTemplate(context, category, options, cfnFilename) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;

  const copyJobs = [
    {
      dir: pluginDir,
      template: `cloudformation-templates/${cfnFilename}`,
      target: `${targetDir}/${category}/${options.resourceName}/${
        options.resourceName
      }-cloudformation-template.yml`,
      paramsFile: `${targetDir}/${category}/${options.resourceName}/parameters.json`,
    },
  ];

  // copy over the files
  // Todo: move to provider as each provider should decide where to store vars, and cfn
  return await context.amplify.copyBatch(context, copyJobs, options, true, false, privateKeys);
}

function saveResourceParameters(
  context,
  providerName,
  category,
  resource,
  params,
  envSpecificParams = [],
) {
  const provider = context.amplify.getPluginInstance(context, providerName);
  provider.saveResourceParameters(
    context,
    category,
    resource,
    params,
    envSpecificParams,
    privateKeys,
  );
}

async function addResource(context, category, service) {
  let props = {};
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const {
    cfnFilename,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
    provider,
  } = serviceMetadata;
  const projectName = context.amplify.getProjectConfig().projectName.toLowerCase();

  return serviceQuestions(
    context,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
  )
    .then(async (result) => {
      const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;
      const { functionMap, generalDefaults, roles } = require(defaultValuesSrc);

      /* if user has used the default configuration,
       * we populate base choices like authSelections and resourceName for them */
      if (['default', 'defaultSocial'].includes(result.useDefault)) {
        result = Object.assign(generalDefaults(projectName), result);
      }

      /* merge actual answers object into props object,
       * ensuring that manual entries override defaults */

      props = Object.assign(functionMap[result.authSelections](result.resourceName), result, roles);

      await copyCfnTemplate(context, category, props, cfnFilename);
      saveResourceParameters(
        context,
        provider,
        category,
        result.resourceName,
        props,
        ENV_SPECIFIC_PARAMS,
      );
    })
    .then(() => props.resourceName);
}

async function updateResource(context, category, serviceResult) {
  const { service, resourceName } = serviceResult;
  let props = {};
  serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))[service];
  const {
    cfnFilename,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
    provider,
  } = serviceMetadata;

  context.updateFlow = await inquirer.prompt({
    name: 'type',
    message: 'What do you want to edit?',
    type: 'list',
    choices: [
      {
        name: 'Walkthrough all the auth configurations',
        value: 'all',
      },
      {
        name: 'Add callback URLs for your hosted UI',
        value: 'callbacks',
      },
      {
        name: 'Update social provider credentials/attributes for your hosted UI',
        value: 'providers',
      },
    ],
  });

  return serviceQuestions(
    context,
    defaultValuesFilename,
    stringMapFilename,
    serviceWalkthroughFilename,
  )
    .then(async (result) => {
      const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;
      const { functionMap, getAllDefaults } = require(defaultValuesSrc);
      const { authProviders } = require(`${__dirname}/assets/string-maps.js`);

      /* if user has used the default configuration,
       * we populate base choices like authSelections and resourceName for them */
      if (!result.authSelections) {
        result.authSelections = 'identityPoolAndUserPool';
      }

      const defaults = getAllDefaults(resourceName);

      const immutables = {};
      // loop through service questions
      serviceMetadata.inputs.forEach((s) => {
        // find those that would not be displayed if user was entering values manually
        if (!context.amplify.getWhen(s, defaults, context.updatingAuth, context.amplify)()) {
          // if a value wouldn't be displayed,
          // we update the immutable object with they key/value from previous answers
          if (context.updatingAuth[s.key]) {
            immutables[s.key] = context.updatingAuth[s.key];
          }
        }
      });

      if (result.useDefault && result.useDefault === 'default') {
        /* if the user elects to use defaults during an edit,
         * we grab all of the static defaults
         * but make sure to pass existing resource name so we don't create a 2nd auth resource
         * and we don't overwrite immutables from the originally entered values */

        props = Object.assign(defaults, immutables, result);
      } else {
        /* if the user does NOT choose defaults during an edit,
         * we merge actual answers object into props object of previous answers,
         * and in turn merge these into the defaults
         * ensuring that manual entries override previous which then
         * override defaults (except immutables) */
        props = Object.assign(
          functionMap[result.authSelections](context.updatingAuth.resourceName),
          context.updatingAuth,
          immutables,
          result,
        ); // eslint-disable-line max-len
      }

      if (!result.thirdPartyAuth) {
        delete props.selectedParties;
        delete props.authProviders;
        authProviders.forEach((a) => {
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

      await copyCfnTemplate(context, category, props, cfnFilename);
      saveResourceParameters(context, provider, category, resourceName, props, ENV_SPECIFIC_PARAMS);
    })
    .then(() => props.resourceName);
}

async function updateConfigOnEnvInit(context, category, service) {
  const srvcMetaData = JSON.parse(fs.readFileSync(`${__dirname}/../supported-services.json`))
    .Cognito;
  const { defaultValuesFilename, stringMapFilename, serviceWalkthroughFilename } = srvcMetaData;

  const providerPlugin = context.amplify.getPluginInstance(context, srvcMetaData.provider);
  // previously selected answers
  const resourceParams = providerPlugin.loadResourceParameters(context, 'auth', service);
  // ask only env specific questions
  const currentEnvSpecificValues = context.amplify.loadEnvResourceParameters(
    context,
    category,
    service,
  );
  srvcMetaData.inputs = srvcMetaData.inputs.filter(input =>
    ENV_SPECIFIC_PARAMS.includes(input.key) &&
      !Object.keys(currentEnvSpecificValues).includes(input.key));

  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = require(serviceWalkthroughSrc);

  // headless mode
  if (isInHeadlessMode(context)) {
    const envParams = {};
    if (resourceParams.thirdPartyAuth) {
      const authParams = getHeadlessParams(context);
      const projectType = context.amplify.getProjectConfig().frontend;
      const mergedValues = { ...resourceParams, ...authParams };
      const requiredParams = getRequiredParamsForHeadlessInit(projectType, resourceParams);
      const missingParams = [];
      requiredParams.forEach((p) => {
        if (Object.keys(mergedValues).includes(p)) {
          envParams[p] = mergedValues[p];
        } else {
          missingParams.push(p);
        }
      });

      if (missingParams.length) {
        throw Error(`auth headless init is missing the following inputParams ${missingParams.join(', ')}`);
      }
    }
    return envParams;
  }

  // interactive mode
  const result = await serviceWalkthrough(
    context,
    defaultValuesFilename,
    stringMapFilename,
    srvcMetaData,
    resourceParams,
  );
  const envParams = {};
  ENV_SPECIFIC_PARAMS.forEach((paramName) => {
    if (paramName in result) {
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
  const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/../../provider-utils/supported-services.json`));
  const { provider, cfnFilename, defaultValuesFilename } = servicesMetadata.Cognito;
  const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;

  const { roles } = require(defaultValuesSrc);

  const providerInstance = amplify.getPluginInstance(context, provider);
  const resourceName = Object.keys(existingAuth)[0];
  const props = providerInstance.loadResourceParameters(context, 'auth', resourceName);
  // Roles have changed to ref. Removing old hardcoded role ref
  Object.keys(roles).forEach((key) => {
    delete props[key];
  });
  await copyCfnTemplate(context, category, props, cfnFilename);
  saveResourceParameters(
    context,
    provider,
    category,
    resourceName,
    { ...roles, ...props },
    ENV_SPECIFIC_PARAMS,
  );
}

function isInHeadlessMode(context) {
  return context.exeInfo.inputParams.yes;
}

function getHeadlessParams(context) {
  const { inputParams } = context.exeInfo;
  const { categories = {} } = inputParams;
  return categories.auth || {};
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
    if (serviceMeta.service === 'Cognito' &&
      serviceMeta.output &&
      (serviceMeta.output.UserPoolId || serviceMeta.output.IdentityPoolId)) {
      cognitoOutput = serviceMeta.output;
      break;
    }
  }
  return cognitoOutput;
}

async function openUserPoolConsole(context, region, userPoolId) {
  const userPoolConsoleUrl =
    `https://console.aws.amazon.com/cognito/users/?region=${region}#/pool/${userPoolId}`;
  await opn(userPoolConsoleUrl, { wait: false });
  context.print.info('User Pool console:');
  context.print.success(userPoolConsoleUrl);
}

async function openIdentityPoolConsole(context, region, identityPoolId) {
  const identityPoolConsoleUrl =
    `https://console.aws.amazon.com/cognito/pool/?region=${region}&id=${identityPoolId}`;
  await opn(identityPoolConsoleUrl, { wait: false });
  context.print.info('Identity Pool console:');
  context.print.success(identityPoolConsoleUrl);
}

module.exports = {
  addResource,
  updateResource,
  updateConfigOnEnvInit,
  saveResourceParameters,
  ENV_SPECIFIC_PARAMS,
  copyCfnTemplate,
  migrate,
  console,
};
