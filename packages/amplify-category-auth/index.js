const category = 'auth';
const fs = require('fs');
const _ = require('lodash');
const uuid = require('uuid');
const defaults = require('./provider-utils/awscloudformation/assets/cognito-defaults');


// this function is being kept for temporary compatability.
async function add(context) {
  const { amplify } = context;
  const servicesMetadata = JSON.parse(fs.readFileSync(`${__dirname}/provider-utils/supported-services.json`));

  const existingAuth = amplify.getProjectDetails().amplifyMeta.auth || {};

  if (Object.keys(existingAuth).length > 0) {
    return context.print.warning('Auth has already been added to this project.');
  }

  let resultMetadata;

  return amplify.serviceSelectionPrompt(context, category, servicesMetadata)
    .then((result) => {
      resultMetadata = result;
      const providerController = require(`${__dirname}/provider-utils/${result.providerName}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }
      return providerController.addResource(context, category, result.service);
    })
    .then((resourceName) => {
      const options = {
        service: resultMetadata.service,
        providerPlugin: resultMetadata.providerName,
      };
      amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
      context.print.success('Successfully added auth resource');
      return resourceName;
    })
    .catch((err) => {
      context.print.info(err.stack);
      context.print.error('There was an error adding the auth resource');
    });
}


async function externalAuthEnable(context, externalCategory, resourceName, requirements) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();
  const pluginDir = __dirname;
  const serviceMetadata = JSON.parse(fs.readFileSync(`${__dirname}/provider-utils/supported-services.json`));
  const { cfnFilename } = serviceMetadata.Cognito;
  const authExists = amplify.getProjectDetails().amplifyMeta.auth && Object.keys(amplify.getProjectDetails().amplifyMeta.auth).length > 0; //eslint-disable-line
  let currentAuthName;
  const projectName = context.amplify.getProjectConfig().projectName.toLowerCase().replace(/[^A-Za-z0-9_]+/g, '_');
  let currentAuthParams;
  const [sharedId] = uuid().split('-');

  const immutables = {};
  // if auth has already been enabled, grab the existing parameters
  if (authExists) {
    currentAuthName = Object.keys(amplify.getProjectDetails().amplifyMeta.auth)[0]; //eslint-disable-line
    currentAuthParams = JSON.parse(fs.readFileSync(`${amplify.pathManager.getBackendDirPath()}/auth/${currentAuthName}/parameters.json`));

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

  /* eslint-disable */
  const authPropsValues = authExists ?
    Object.assign(defaults.functionMap[requirements.authSelections](currentAuthName), currentAuthParams, immutables, requirements) :
    Object.assign(defaults.functionMap[requirements.authSelections](currentAuthName), requirements, { resourceName: `cognito${sharedId}` }); //eslint-disable-line
  /* eslint-enable */
  const roles = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'staticRoles');
  const authProps = {
    ...authPropsValues,
    ...roles,
  };

  try {
    const copyJobs = [
      {
        dir: pluginDir,
        template: `provider-utils/awscloudformation/cloudformation-templates/${cfnFilename}`,
        target: `${targetDir}/${category}/${authProps.resourceName}/${authProps.resourceName}-cloudformation-template.yml`,
        paramsFile: `${targetDir}/${category}/${authProps.resourceName}/parameters.json`,
      },
    ];

    // copy over the files
    await context.amplify.copyBatch(context, copyJobs, authProps, true, true);
    if (!context.updatingAuth) {
      const options = {
        service: 'Cognito',
        providerPlugin: 'awscloudformation',
      };
      await amplify.updateamplifyMetaAfterResourceAdd(category, authProps.resourceName, options);
    }
    const action = context.updatingAuth ? 'updated' : 'added';
    context.print.success(`Successfully ${action} auth resource locally.`);

    return requirements.resourceName;
  } catch (e) {
    return new Error('Error updating Cognito resource');
  }
}

async function checkRequirements(requirements, context) {
  if (!requirements || !requirements.authSelections) {
    const error = 'Your plugin has not properly defined it\'s Cognito requirements.';
    context.print.error(error);
    return new Error(error);
  }

  if (_.intersection(Object.keys(requirements)).length !== Object.keys(requirements).length) {
    const error = 'Your plugin has requested invalid Cognito requirements';
    context.print.error(error);
    return new Error(error);
  }

  const { amplify } = context;
  const existingAuth = amplify.getProjectDetails().amplifyMeta.auth;
  let authParameters;

  if (existingAuth && Object.keys(existingAuth).length > 0) {
    authParameters = JSON.parse(fs.readFileSync(`${amplify.pathManager.getBackendDirPath()}/auth/${Object.keys(existingAuth)[0]}/parameters.json`));
  } else {
    return { authEnabled: false };
  }

  const requirementKeys = Object.keys(requirements);
  const requirementValues = Object.values(requirements);
  const result = {};
  requirementKeys.forEach((r, i) => {
    if (authParameters[r] !== requirementValues[i]) {
      result[r] = false;
    } else {
      result[r] = true;
    }
  });

  return result;
}

module.exports = {
  externalAuthEnable,
  checkRequirements,
  add,
};
