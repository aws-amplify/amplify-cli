const xrManager = require('./lib/xr-manager');
const inquirer = require('inquirer');

const SUMERIAN_SERVICE_NAME = 'Sumerian';
const XR_CATEGORY_NAME = 'xr';

function console(context) {
  return xrManager.console(context);
}

async function initEnv(context) {
  const currentEnvInfo = context.amplify.getEnvInfo();
  const thisEnvName = currentEnvInfo.envName;
  const allEnvs = context.amplify.getEnvDetails();

  // If the environment already has xr configured, exit
  if (allEnvs[thisEnvName].categories[XR_CATEGORY_NAME]) {
    return;
  }

  if (Object.keys(allEnvs).length > 1) {
    const useConfigAnswer = await inquirer.prompt({
      name: 'useExistingEnvConfig',
      type: 'confirm',
      message: 'Would you like to use XR configuration from an existing environment?',
      default: false,
    });

    if (useConfigAnswer.useExistingEnvConfig) {
      // Get environments with XR defined
      const envsWithXR = [];
      Object.entries(allEnvs).forEach(([env, config]) => {
        if (XR_CATEGORY_NAME in config.categories) {
          envsWithXR.push(env);
        }
      });

      await inquirer.prompt({
        name: 'envToUse',
        message: 'Choose the environment configuration to use:',
        type: 'list',
        choices: envsWithXR,
      }).then((envAnswer) => {
        const xrResources = allEnvs[envAnswer.envToUse].categories[XR_CATEGORY_NAME];
        Object.entries(xrResources).forEach(([resource, config]) => {
          const options = {
            service: SUMERIAN_SERVICE_NAME,
            output: config,
          };
          context.amplify.saveEnvResourceParameters(context, XR_CATEGORY_NAME, resource, config);
          context.amplify.updateamplifyMetaAfterResourceAdd(XR_CATEGORY_NAME, resource, options);
        });
        context.print.info(`XR configuration from ${envAnswer.envToUse} saved for ${thisEnvName}`);
      });
      return;
    }
  }

  const backendConfig = context.amplify.readJsonFile(context.amplify.pathManager.getBackendConfigFilePath());
  const xrResources = Object.keys(backendConfig.xr);

  if (xrResources.length > 0) {
    context.print.warning('To continue, you will need to add configuration for the following resources:');
    context.print.warning(xrResources);

    // Hydrate XR resources defined in cloud backend config
    for (let i = 0; i < xrResources.length; i += 1) {
      await xrManager.addSceneConfig(context, xrResources[i]);
    }
  }
}

async function getPermissionPolicies(context, resourceOpsMapping) {
  const permissionPolicies = [];
  const resourceAttributes = [];

  Object.keys(resourceOpsMapping).forEach((resourceName) => {
    const { policy, attributes } = xrManager.getIAMPolicies(
      context,
      resourceName,
      resourceOpsMapping[resourceName],
    );
    permissionPolicies.push(policy);
    resourceAttributes.push({ resourceName, attributes, category: XR_CATEGORY_NAME });
  });

  return { permissionPolicies, resourceAttributes };
}


module.exports = {
  console,
  initEnv,
  getPermissionPolicies,
};
