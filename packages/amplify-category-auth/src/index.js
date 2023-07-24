// TODO disabling until this file is converted to TS
/* eslint-disable */

const category = 'auth';

const _ = require('lodash');
const path = require('path');
const sequential = require('promise-sequential');

const { validateAddAuthRequest, validateUpdateAuthRequest, validateImportAuthRequest } = require('amplify-util-headless-input');
const { stateManager, AmplifySupportedService, JSONUtilities } = require('@aws-amplify/amplify-cli-core');
const { printer } = require('@aws-amplify/amplify-prompts');
const { ensureEnvParamManager } = require('@aws-amplify/amplify-environment-parameters');
const defaults = require('./provider-utils/awscloudformation/assets/cognito-defaults');
const { getAuthResourceName } = require('./utils/getAuthResourceName');
const { updateConfigOnEnvInit, migrate } = require('./provider-utils/awscloudformation');
const { removeDeprecatedProps } = require('./provider-utils/awscloudformation/utils/synthesize-resources');
const { ENV_SPECIFIC_PARAMS } = require('./provider-utils/awscloudformation/constants');

const { transformUserPoolGroupSchema } = require('./provider-utils/awscloudformation/utils/transform-user-pool-group');
const { uploadFiles } = require('./provider-utils/awscloudformation/utils/trigger-file-uploader');
const { getAddAuthRequestAdaptor, getUpdateAuthRequestAdaptor } = require('./provider-utils/awscloudformation/utils/auth-request-adaptors');
const { getAddAuthHandler, getUpdateAuthHandler } = require('./provider-utils/awscloudformation/handlers/resource-handlers');
const { projectHasAuth } = require('./provider-utils/awscloudformation/utils/project-has-auth');
const { printAuthExistsWarning } = require('./provider-utils/awscloudformation/utils/print-auth-exists-warning');
const { attachPrevParamsToContext } = require('./provider-utils/awscloudformation/utils/attach-prev-params-to-context');
const { headlessImport } = require('./provider-utils/awscloudformation/import');
const { getFrontendConfig } = require('./provider-utils/awscloudformation/utils/amplify-meta-updaters');
const { AuthParameters } = require('./provider-utils/awscloudformation/import/types');
const { getSupportedServices } = require('./provider-utils/supported-services');
const { generateAuthStackTemplate } = require('./provider-utils/awscloudformation/utils/generate-auth-stack-template');
const { AmplifyAuthTransform, AmplifyUserPoolGroupTransform } = require('./provider-utils/awscloudformation/auth-stack-builder');
const {
  doesConfigurationIncludeSMS,
  loadResourceParameters,
  loadImportedAuthParameters,
} = require('./provider-utils/awscloudformation/utils/auth-sms-workflow-helper');
const { AuthInputState } = require('./provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');
const { privateKeys } = require('./provider-utils/awscloudformation/constants');
const { checkAuthResourceMigration } = require('./provider-utils/awscloudformation/utils/check-for-auth-migration');
const { run: authRunPush } = require('./commands/auth/push');
const { getAuthTriggerStackCfnParameters } = require('./provider-utils/awscloudformation/utils/get-auth-trigger-stack-cfn-parameters');
const { updateAppClientWithGeneratedSecret } = require('./provider-utils/awscloudformation/utils/generate-cognito-app-client-secret');
const { prePushHandler } = require('./events/prePushHandler');

// this function is being kept for temporary compatability.
async function add(context, skipNextSteps = false) {
  const { amplify } = context;
  const servicesMetadata = getSupportedServices();
  const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

  if (Object.keys(existingAuth).length > 0) {
    return context.print.warning('Auth has already been added to this project.');
  }

  let resultMetadata;

  return amplify
    .serviceSelectionPrompt(context, category, servicesMetadata)
    .then((result) => {
      resultMetadata = result;
      const providerController = require(`${__dirname}/provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      return providerController.addResource(context, result.service, skipNextSteps);
    })
    .catch((err) => {
      context.print.info(err.stack);
      context.print.error('There was an error adding the auth resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
}

async function transformCategoryStack(context, resource) {
  if (resource.service === AmplifySupportedService.COGNITO) {
    if (canResourceBeTransformed(context, resource.resourceName)) {
      await generateAuthStackTemplate(context, resource.resourceName);
    }
  }
  if (resource.service === AmplifySupportedService.COGNITOUSERPOOLGROUPS) {
    const authResourceName = await getAuthResourceName(context);
    if (canResourceBeTransformed(context, authResourceName)) {
      await generateAuthStackTemplate(context, authResourceName);
    }
  }
}

function canResourceBeTransformed(context, resourceName) {
  const resourceInputState = new AuthInputState(context, resourceName);
  return resourceInputState.cliInputFileExists();
}

async function migrateAuthResource(context, resourceName) {
  return checkAuthResourceMigration(context, resourceName, true);
}

async function externalAuthEnable(context, externalCategory, resourceName, requirements) {
  const { amplify } = context;
  const serviceMetadata = getSupportedServices();
  const authExists = amplify.getProjectDetails().amplifyMeta.auth && Object.keys(amplify.getProjectDetails().amplifyMeta.auth).length > 0; //eslint-disable-line
  let currentAuthName;
  const projectName = context.amplify
    .getProjectConfig()
    .projectName.toLowerCase()
    .replace(/[^A-Za-z0-9_]+/g, '_');
  let currentAuthParams;

  const immutables = {};

  // if auth has already been enabled, grab the existing parameters
  if (authExists) {
    // sanity check that it cannot happen
    if (authExists.serviceType === 'imported') {
      throw new Error('Existing auth resource is imported and auth configuration update was requested.');
    }
    currentAuthName = await getAuthResourceName(context);
    // check for migration when auth has been enabled
    await checkAuthResourceMigration(context, currentAuthName, true);
    const { provider } = serviceMetadata.Cognito;
    const providerPlugin = context.amplify.getPluginInstance(context, provider);
    currentAuthParams = providerPlugin.loadResourceParameters(context, 'auth', currentAuthName);

    if (requirements.authSelections.includes('identityPoolOnly') && currentAuthParams.userPoolName) {
      requirements.authSelections = 'identityPoolAndUserPool';
    }
    if (requirements.authSelections.includes('userPoolOnly') && currentAuthParams.identityPoolName) {
      requirements.authSelections = 'identityPoolAndUserPool';
    }

    const defaultVals = defaults.getAllDefaults(currentAuthName);
    // loop through service questions
    serviceMetadata.Cognito.inputs.forEach((s) => {
      // find those that would not be displayed if user was entering values manually
      if (!context.amplify.getWhen(s, defaultVals, currentAuthParams, context.amplify)()) {
        // if a value wouldn't be displayed,
        // we update the immutable object with they key/value from previous answers
        if (currentAuthParams[s.key]) {
          immutables[s.key] = currentAuthParams[s.key];
        }
      }
    });
  } else {
    currentAuthName = projectName;
  }

  const authPropsValues = authExists
    ? Object.assign(defaults.functionMap[requirements.authSelections](currentAuthName), currentAuthParams, immutables, requirements)
    : Object.assign(defaults.functionMap[requirements.authSelections](currentAuthName), requirements, {
        resourceName: currentAuthName,
        sharedId: defaults.sharedId,
        serviceName: 'Cognito',
        useDefault: 'manual',
        authSelections: requirements.authSelections,
      });
  const { roles } = defaults;
  let authProps = {
    ...authPropsValues,
    ...roles,
  };

  try {
    authProps = await removeDeprecatedProps(authProps);
    // replace secret keys from cli inputs to be stored in deployment secrets

    let sharedParams = { ...authProps };
    privateKeys.forEach((p) => delete sharedParams[p]);
    sharedParams = removeDeprecatedProps(sharedParams);
    // extracting env-specific params from parameters object
    const envSpecificParams = {};
    const cliInputs = { ...sharedParams };
    ENV_SPECIFIC_PARAMS.forEach((paramName) => {
      if (paramName in authProps) {
        envSpecificParams[paramName] = cliInputs[paramName];
        delete cliInputs[paramName];
      }
    });
    context.amplify.saveEnvResourceParameters(context, category, currentAuthName, envSpecificParams);
    const cognitoCLIInputs = {
      version: '1',
      cognitoConfig: cliInputs,
    };
    const cliState = new AuthInputState(context, cognitoCLIInputs.cognitoConfig.resourceName);
    // saving cli-inputs except secrets
    await cliState.saveCLIInputPayload(cognitoCLIInputs);
    await generateAuthStackTemplate(context, currentAuthName);

    const resourceDirPath = path.join(amplify.pathManager.getBackendDirPath(), 'auth', authProps.resourceName, 'build', 'parameters.json');
    const authParameters = await amplify.readJsonFile(resourceDirPath);
    if (!authExists) {
      const options = {
        service: 'Cognito',
        serviceType: 'managed',
        providerPlugin: 'awscloudformation',
      };

      if (authParameters.dependsOn) {
        options.dependsOn = authParameters.dependsOn;
      }
      await amplify.updateamplifyMetaAfterResourceAdd(category, authProps.resourceName, options);
    }

    // Update Identity Pool dependency attributes on userpool groups
    const allResources = context.amplify.getProjectMeta();
    if (allResources.auth && allResources.auth.userPoolGroups) {
      const attributes = ['UserPoolId', 'AppClientIDWeb', 'AppClientID'];
      if (authParameters.identityPoolName) {
        attributes.push('IdentityPoolId');
      }
      const userPoolGroupDependsOn = [
        {
          category: 'auth',
          resourceName: authProps.resourceName,
          attributes,
        },
      ];

      amplify.updateamplifyMetaAfterResourceUpdate('auth', 'userPoolGroups', 'dependsOn', userPoolGroupDependsOn);
      await transformUserPoolGroupSchema(context);
    }

    const action = authExists ? 'updated' : 'added';
    printer.success(`Successfully ${action} auth resource locally.`);

    return authProps.resourceName;
  } catch (e) {
    printer.error('Error updating Cognito resource');
    throw e;
  }
}

async function checkRequirements(requirements, context, category, targetResourceName) {
  // We only require the checking of two properties:
  // - authSelections
  // - allowUnauthenticatedIdentities

  if (!requirements || !requirements.authSelections) {
    const error = `Your plugin has not properly defined it's Cognito requirements.`;
    return {
      errors: [error],
    };
  }

  const existingAuth = context.amplify.getProjectDetails().amplifyMeta.auth;
  let authParameters;

  const result = {
    errors: [],
  };

  if (existingAuth && Object.keys(existingAuth).length > 0) {
    const authResourceName = await getAuthResourceName(context);
    const authResource = existingAuth[authResourceName];

    authParameters = stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);

    result.authEnabled = true;
    result.authImported = false;

    // For imported resource we have to read the team-provider-info and merge the env specific values
    // (currently only allowUnauthenticatedIdentities) to params because it is stored there.
    if (authResource.serviceType === 'imported') {
      const envSpecificParams = context.amplify.loadEnvResourceParameters(context, 'auth', authResourceName);

      // This is stored in env specific params for imported auth resources.
      if (envSpecificParams) {
        authParameters.allowUnauthenticatedIdentities = envSpecificParams.allowUnauthenticatedIdentities;
      }

      result.authImported = true;
    }
  } else {
    return {
      authEnabled: false,
    };
  }

  // Checks handcoded until refactoring of the requirements system
  // since intersections were not handled correctly.
  if (
    (requirements.authSelections === 'userPoolOnly' &&
      (authParameters.authSelections === 'userPoolOnly' || authParameters.authSelections === 'identityPoolAndUserPool')) ||
    (requirements.authSelections === 'identityPoolOnly' && authParameters.authSelections === 'identityPoolOnly') ||
    (requirements.authSelections === 'identityPoolOnly' && authParameters.authSelections === 'identityPoolAndUserPool') ||
    (requirements.authSelections === 'identityPoolAndUserPool' && authParameters.authSelections === 'identityPoolAndUserPool')
  ) {
    result.authSelections = true;
  } else {
    result.authSelections = false;
    result.errors.push(`Current auth configuration is: ${authParameters.authSelections}, but ${requirements.authSelections} was required.`);
  }

  if (
    (requirements.allowUnauthenticatedIdentities === true && authParameters.allowUnauthenticatedIdentities === true) ||
    !requirements.allowUnauthenticatedIdentities // In this case it does not matter if IDP allows unauth access or not, requirements are met.
  ) {
    result.allowUnauthenticatedIdentities = true;
  } else {
    result.allowUnauthenticatedIdentities = false;
    result.errors.push(`Specified resource configuration requires Cognito Identity Provider unauthenticated access but it is not enabled.`);
  }

  result.requirementsMet = result.authSelections && result.allowUnauthenticatedIdentities;

  return result;
}

async function initEnv(context) {
  const { amplify } = context;
  const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeSynced, resourcesToBeDeleted, allResources } =
    await amplify.getResourceStatus('auth');
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
  let toBeCreated = [];
  let toBeUpdated = [];
  let toBeSynced = [];
  let toBeDeleted = [];

  if (resourcesToBeCreated && resourcesToBeCreated.length > 0) {
    toBeCreated = resourcesToBeCreated.filter((a) => a.category === 'auth');
  }
  if (resourcesToBeUpdated && resourcesToBeUpdated.length > 0) {
    toBeUpdated = resourcesToBeUpdated.filter((c) => c.category === 'auth');
  }
  if (resourcesToBeSynced && resourcesToBeSynced.length > 0) {
    toBeSynced = resourcesToBeSynced.filter((b) => b.category === 'auth');
  }
  if (resourcesToBeDeleted && resourcesToBeDeleted.length > 0) {
    toBeDeleted = resourcesToBeDeleted.filter((b) => b.category === 'auth');
  }

  await ensureEnvParamManager();

  toBeDeleted.forEach((authResource) => {
    amplify.removeResourceParameters(context, 'auth', authResource.resourceName);
  });

  toBeSynced
    .filter((authResource) => authResource.sync === 'unlink')
    .forEach((authResource) => {
      amplify.removeResourceParameters(context, 'auth', authResource.resourceName);
    });

  let tasks = toBeCreated.concat(toBeUpdated);

  // For pull change detection for import sees a difference, to avoid duplicate tasks we don't
  // add the syncable resources, as allResources covers it, otherwise it is required for env add
  // to populate the output value and such, these sync resources have the 'refresh' sync value.
  if (!isPulling) {
    tasks = tasks.concat(toBeSynced);
  }

  // check if this initialization is happening on a pull
  if (isPulling && allResources.length > 0) {
    tasks.push(...allResources);
  }

  const authTasks = tasks.map((authResource) => {
    const { resourceName } = authResource;
    return async () => {
      const config = await updateConfigOnEnvInit(context, 'auth', resourceName);
      context.amplify.saveEnvResourceParameters(context, 'auth', resourceName, config);
    };
  });

  await sequential(authTasks);
}

async function authConsole(context) {
  const { amplify } = context;
  const amplifyMeta = amplify.getProjectMeta();

  if (!amplifyMeta.auth || Object.keys(amplifyMeta.auth).length === 0) {
    return context.print.error('Auth has NOT been added to this project.');
  }

  return amplify
    .serviceSelectionPrompt(context, category, getSupportedServices())
    .then((result) => {
      const providerController = require(`${__dirname}/provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      return providerController.console(context, amplifyMeta);
    })
    .catch((err) => {
      context.print.info(err.stack);
      context.print.error('There was an error trying to open the auth web console.');
      throw err;
    });
}

async function getPermissionPolicies(context, resourceOpsMapping) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies = [];
  const resourceAttributes = [];

  Object.keys(resourceOpsMapping).forEach((resourceName) => {
    try {
      const providerName = amplifyMeta[category][resourceName].providerPlugin;
      if (providerName) {
        const providerController = require(`./provider-utils/${providerName}/index`);
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          amplifyMeta[category][resourceName].service,
          resourceName,
          resourceOpsMapping[resourceName],
        );
        permissionPolicies.push(policy);
        resourceAttributes.push({ resourceName, attributes, category });
      } else {
        context.print.error(`Provider not configured for ${category}: ${resourceName}`);
      }
    } catch (e) {
      context.print.warning(`Could not get policies for ${category}: ${resourceName}`);
      throw e;
    }
  });
  return { permissionPolicies, resourceAttributes };
}

async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

/**
 * Entry point for headless commands
 * @param {any} context The amplify context object
 * @param {string} headlessPayload The serialized payload from the platform
 */
const executeAmplifyHeadlessCommand = async (context, headlessPayload) => {
  context.usageData.pushHeadlessFlow(headlessPayload, context.input);
  switch (context.input.command) {
    case 'add':
      if (projectHasAuth()) {
        printAuthExistsWarning(context);
        return;
      }
      await validateAddAuthRequest(headlessPayload)
        .then(getAddAuthRequestAdaptor(context.amplify.getProjectConfig().frontend))
        .then(getAddAuthHandler(context));
      return;
    case 'update':
      // migration check for headless update
      const authResourceName = await getAuthResourceName(context);
      await checkAuthResourceMigration(context, authResourceName, true);
      await attachPrevParamsToContext(context);
      await validateUpdateAuthRequest(headlessPayload)
        .then(getUpdateAuthRequestAdaptor(context.amplify.getProjectConfig().frontend, context.updatingAuth.requiredAttributes))
        .then(getUpdateAuthHandler(context));
      return;
    case 'import':
      if (projectHasAuth()) {
        printAuthExistsWarning(context);
        return;
      }
      await validateImportAuthRequest(headlessPayload);
      const { provider } = getSupportedServices().Cognito;
      const providerPlugin = context.amplify.getPluginInstance(context, provider);
      const cognito = await providerPlugin.createCognitoUserPoolService(context);
      const identity = await providerPlugin.createIdentityPoolService(context);
      const { userPoolId, identityPoolId, nativeClientId, webClientId } = JSONUtilities.parse(headlessPayload);
      const projectConfig = context.amplify.getProjectConfig();
      const resourceName = projectConfig.projectName.toLowerCase().replace(/[^A-Za-z0-9_]+/g, '_');
      const resourceParams = {
        authSelections: identityPoolId ? 'identityPoolAndUserPool' : 'userPoolOnly',
        resourceName,
      };
      await headlessImport(context, cognito, identity, provider, resourceName, resourceParams, {
        userPoolId,
        identityPoolId,
        nativeClientId,
        webClientId,
      });
      return;
    default:
      context.print.error(`Headless mode for ${context.input.command} auth is not implemented yet`);
  }
};

async function handleAmplifyEvent(context, args) {
  switch (args.event) {
    case 'PrePush':
      await prePushHandler(context);
      break;
    default:
      printer.info(`Event handler for ${args.event} not implemented by ${category} category`);
  }
}

async function prePushAuthHook(context) {
  // await transformUserPoolGroupSchema(context);
}

async function importAuth(context) {
  const { amplify } = context;
  const servicesMetadata = getSupportedServices();
  const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

  if (Object.keys(existingAuth).length > 0) {
    return context.print.warning('Auth has already been added to this project.');
  }

  const serviceSelection = await context.amplify.serviceSelectionPrompt(context, category, servicesMetadata);
  const providerController = require(`./provider-utils/${serviceSelection.providerName}`);

  return providerController.importResource(context, serviceSelection, undefined, undefined, false);
}

async function isSMSWorkflowEnabled(context, resourceName) {
  const { imported, userPoolId } = context.amplify.getImportedAuthProperties(context);
  let userNameAndMfaConfig;
  if (imported) {
    userNameAndMfaConfig = await loadImportedAuthParameters(context, userPoolId);
  } else {
    userNameAndMfaConfig = loadResourceParameters(context, resourceName);
  }
  const result = doesConfigurationIncludeSMS(userNameAndMfaConfig);
  return result;
}

/**
 * Execute auth Push command with force yes
 * @param {Object} context - The amplify context.
 */
const authPushYes = async (context) => {
  const exeInfoClone = { ...context?.exeInfo };
  const parametersClone = { ...context?.parameters };
  try {
    context.exeInfo = context.exeInfo || {};
    context.exeInfo.inputParams = context.exeInfo.inputParams || {};
    context.exeInfo.inputParams.yes = true; // force yes to avoid prompts
    context.parameters = context.parameters || {};
    context.parameters.options.yes = true;
    context.parameters.first = undefined;
    await authRunPush(context);
  } finally {
    context.exeInfo = exeInfoClone;
    context.parameters = parametersClone;
  }
};

module.exports = {
  externalAuthEnable,
  migrateAuthResource,
  checkRequirements,
  add,
  migrate,
  initEnv,
  console: authConsole,
  getPermissionPolicies,
  executeAmplifyCommand,
  executeAmplifyHeadlessCommand,
  handleAmplifyEvent,
  prePushAuthHook,
  uploadFiles,
  category,
  importAuth,
  isSMSWorkflowEnabled,
  AuthParameters,
  getFrontendConfig,
  generateAuthStackTemplate,
  AmplifyAuthTransform,
  AmplifyUserPoolGroupTransform,
  transformCategoryStack,
  authPluginAPIPush: authPushYes,
  getAuthTriggerStackCfnParameters,
  updateAppClientWithGeneratedSecret,
};

// force major version bump for cdk v2
