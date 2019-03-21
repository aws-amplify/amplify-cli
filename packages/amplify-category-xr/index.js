const xrManager = require('./lib/xr-manager');
const inquirer = require('inquirer');
const fs = require('fs-extra');

const SUMERIAN_SERVICE_NAME = "Sumerian";
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
    const answer = await inquirer.prompt({
      name: 'useExistingEnvConfig',
      type: 'confirm',
      message: 'Would you like to use XR configuration from an existing environment?',
      default: false,
    });
  
    if (answer.useExistingEnvConfig) {
      // Get environments with XR defined
      const envsWithXR = [];
      for (let [env, config] of Object.entries(allEnvs)) {
        if (XR_CATEGORY_NAME in config.categories) {
          envsWithXR.push(env);
        }
      }

      await inquirer.prompt({
        name: 'envToUse',
        message: 'Choose the environment configuration to use:',
        type: 'list',
        choices: envsWithXR,
      }).then((answer) => {
        const xrResources = allEnvs[answer.envToUse].categories[XR_CATEGORY_NAME];
        for (let [resource, config] of Object.entries(xrResources)) {
          const options = {
            service: SUMERIAN_SERVICE_NAME,
            output: config
          }
          context.amplify.saveEnvResourceParameters(context, XR_CATEGORY_NAME, resource, config);
          context.amplify.updateamplifyMetaAfterResourceAdd(XR_CATEGORY_NAME, resource, options);
        }
        context.print.info(`XR configuration from ${answer.envToUse} saved for ${thisEnvName}`);
      });
      return;
    }
  }

  // Hydrate XR resources defined in cloud backend config
  const backendConfig = JSON.parse(fs.readFileSync(context.amplify.pathManager.getBackendConfigFilePath()));
  const xrResources = Object.keys(backendConfig.xr);

  for (const sceneName of xrResources) {
    await xrManager.addSceneConfig(context, sceneName);
  }
}

module.exports = {
  console,
  initEnv,
};
