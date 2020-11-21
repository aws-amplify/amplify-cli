const category = 'auth';

const _ = require('lodash');
const uuid = require('uuid');
const path = require('path');
const sequential = require('promise-sequential');

const defaults = require('./provider-utils/awscloudformation/assets/cognito-defaults');
const { getAuthResourceName } = require('./utils/getAuthResourceName');
const { updateConfigOnEnvInit, migrate } = require('./provider-utils/awscloudformation');
const {
  copyCfnTemplate,
  saveResourceParameters,
  removeDeprecatedProps,
} = require('./provider-utils/awscloudformation/utils/synthesize-resources');
const { ENV_SPECIFIC_PARAMS } = require('./provider-utils/awscloudformation/constants');

const { transformUserPoolGroupSchema } = require('./provider-utils/awscloudformation/utils/transform-user-pool-group');
const { uploadFiles } = require('./provider-utils/awscloudformation/utils/trigger-file-uploader');
const { validateAddAuthRequest, validateUpdateAuthRequest } = require('amplify-util-headless-input');
const { getAddAuthRequestAdaptor, getUpdateAuthRequestAdaptor } = require('./provider-utils/awscloudformation/utils/auth-request-adaptors');
const { getAddAuthHandler, getUpdateAuthHandler } = require('./provider-utils/awscloudformation/handlers/resource-handlers');
const { projectHasAuth } = require('./provider-utils/awscloudformation/utils/project-has-auth');
const { attachPrevParamsToContext } = require('./provider-utils/awscloudformation/utils/attach-prev-params-to-context');
const { stateManager } = require('amplify-cli-core');

// this function is being kept for temporary compatability.
async function add(context) {
  const { amplify } = context;
  const servicesMetadata = require('./provider-utils/supported-services').supportedServices;
  const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

  if (Object.keys(existingAuth).length > 0) {
    return context.print.warning('Auth has already been added to this project.');
  }

  let resultMetadata;

  return amplify
    .serviceSelectionPrompt(context, category, servicesMetadata)
    .then(result => {
      resultMetadata = result;
      const providerController = require(`${__dirname}/provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      return providerController.addResource(context, result.service);
    })
    .catch(err => {
      context.print.info(err.stack);
      context.print.error('There was an error adding the auth resource');
      context.usageData.emitError(err);
      process.exitCode = 1;
    });
}

async function externalAuthEnable(context, externalCategory, resourceName, requirements) {
  const { amplify } = context;
  const serviceMetadata = require('./provider-utils/supported-services').supportedServices;
  const { cfnFilename, provider } = serviceMetadata.Cognito;
  const authExists = amplify.getProjectDetails().amplifyMeta.auth && Object.keys(amplify.getProjectDetails().amplifyMeta.auth).length > 0; //eslint-disable-line
  let currentAuthName;
  const projectName = context.amplify
    .getProjectConfig()
    .projectName.toLowerCase()
    .replace(/[^A-Za-z0-9_]+/g, '_');
  let currentAuthParams;
  const [sharedId] = uuid().split('-');

  const immutables = {};

  // if auth has already been enabled, grab the existing parameters
  if (authExists) {
    const providerPlugin = context.amplify.getPluginInstance(context, provider);
    currentAuthName = await getAuthResourceName(context);
    currentAuthParams = providerPlugin.loadResourceParameters(context, 'auth', currentAuthName);

    // sanity check that it cannot happen
    const existingAuthResource = _.get(amplify.getProjectDetails().amplifyMeta, ['auth', currentAuthName], undefined);
    if (existingAuthResource && existingAuthResource.serviceType === 'imported') {
      throw new Error('Existing auth resource is imported and auth configuration update was requested.');
    }

    if (requirements.authSelections.includes('identityPoolOnly') && currentAuthParams.userPoolName) {
      requirements.authSelections = 'identityPoolAndUserPool';
    }
    if (requirements.authSelections.includes('userPoolOnly') && currentAuthParams.identityPoolName) {
      requirements.authSelections = 'identityPoolAndUserPool';
    }

    const defaultVals = defaults.getAllDefaults(currentAuthName);
    // loop through service questions
    serviceMetadata.Cognito.inputs.forEach(s => {
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

  /* eslint-disable */
  const authPropsValues = authExists
    ? Object.assign(defaults.functionMap[requirements.authSelections](currentAuthName), currentAuthParams, immutables, requirements)
    : Object.assign(defaults.functionMap[requirements.authSelections](currentAuthName), requirements, {
        resourceName: `cognito${sharedId}`,
      }); //eslint-disable-line
  /* eslint-enable */
  const { roles } = defaults;
  let authProps = {
    ...authPropsValues,
    ...roles,
  };

  try {
    authProps = await removeDeprecatedProps(authProps);
    await copyCfnTemplate(context, category, authProps, cfnFilename);
    await saveResourceParameters(context, provider, category, authProps.resourceName, authProps, ENV_SPECIFIC_PARAMS);
    const resourceDirPath = path.join(amplify.pathManager.getBackendDirPath(), 'auth', authProps.resourceName, 'parameters.json');
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
      let attributes = ['UserPoolId', 'AppClientIDWeb', 'AppClientID'];
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
    context.print.success(`Successfully ${action} auth resource locally.`);

    return authProps.resourceName;
  } catch (e) {
    context.print.error('Error updating Cognito resource');
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
    result.errors.push(`Auth configuration is required to allow unauthenticated users, but it is not configured properly.`);
  }

  result.requirementsMet = result.authSelections && result.allowUnauthenticatedIdentities;

  return result;
}

async function initEnv(context) {
  const { amplify } = context;
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeSynced,
    resourcesToBeDeleted,
    allResources,
  } = await amplify.getResourceStatus('auth');
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
  let toBeCreated = [];
  let toBeUpdated = [];
  let toBeSynced = [];
  let toBeDeleted = [];

  if (resourcesToBeCreated && resourcesToBeCreated.length > 0) {
    toBeCreated = resourcesToBeCreated.filter(a => a.category === 'auth');
  }
  if (resourcesToBeUpdated && resourcesToBeUpdated.length > 0) {
    toBeUpdated = resourcesToBeUpdated.filter(c => c.category === 'auth');
  }
  if (resourcesToBeSynced && resourcesToBeSynced.length > 0) {
    toBeSynced = resourcesToBeSynced.filter(b => b.category === 'auth');
  }
  if (resourcesToBeDeleted && resourcesToBeDeleted.length > 0) {
    toBeDeleted = resourcesToBeDeleted.filter(b => b.category === 'auth');
  }

  toBeDeleted.forEach(authResource => {
    amplify.removeResourceParameters(context, 'auth', authResource.resourceName);
  });

  toBeSynced
    .filter(authResource => authResource.sync === 'unlink')
    .forEach(authResource => {
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

  const authTasks = tasks.map(authResource => {
    const { resourceName } = authResource;
    return async () => {
      const config = await updateConfigOnEnvInit(context, 'auth', resourceName);
      context.amplify.saveEnvResourceParameters(context, 'auth', resourceName, config);
    };
  });

  await sequential(authTasks);
}

async function console(context) {
  const { amplify } = context;
  const { supportedServices } = require('./provider-utils/supported-services');
  const amplifyMeta = amplify.getProjectMeta();

  if (!amplifyMeta.auth || Object.keys(amplifyMeta.auth).length === 0) {
    return context.print.error('Auth has NOT been added to this project.');
  }

  return amplify
    .serviceSelectionPrompt(context, category, supportedServices)
    .then(result => {
      const providerController = require(`${__dirname}/provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      return providerController.console(context, amplifyMeta);
    })
    .catch(err => {
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

  Object.keys(resourceOpsMapping).forEach(resourceName => {
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
  switch (context.input.command) {
    case 'add':
      if (projectHasAuth(context)) {
        return;
      }
      await validateAddAuthRequest(headlessPayload)
        .then(getAddAuthRequestAdaptor(context.amplify.getProjectConfig().frontend))
        .then(getAddAuthHandler(context));
      return;
    case 'update':
      await attachPrevParamsToContext(context);
      await validateUpdateAuthRequest(headlessPayload)
        .then(getUpdateAuthRequestAdaptor(context.amplify.getProjectConfig().frontend, context.updatingAuth.requiredAttributes))
        .then(getUpdateAuthHandler(context));
      return;
    default:
      context.print.error(`Headless mode for ${context.input.command} auth is not implemented yet`);
      return;
  }
};

async function handleAmplifyEvent(context, args) {
  context.print.info(`${category} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}

async function prePushAuthHook(context) {
  await transformUserPoolGroupSchema(context);
}

module.exports = {
  externalAuthEnable,
  checkRequirements,
  add,
  migrate,
  initEnv,
  console,
  getPermissionPolicies,
  executeAmplifyCommand,
  executeAmplifyHeadlessCommand,
  handleAmplifyEvent,
  prePushAuthHook,
  uploadFiles,
  category,
};
