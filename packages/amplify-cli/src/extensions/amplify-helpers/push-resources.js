const fs = require('fs-extra');
const { getProjectConfig } = require('./get-project-config');
const { showResourceTable } = require('./resource-status');
const { onCategoryOutputsChange } = require('./on-category-outputs-change');
const { initializeEnv } = require('../../lib/initialize-env');
const { getProviderPlugins } = require('./get-provider-plugins');

async function pushResources(context, category, resourceName) {
  if (context.parameters.options.env) {
    const envName = context.parameters.options.env;
    const allEnvs = context.amplify.getAllEnvs(context);
    if (allEnvs.findIndex(env => env === envName) !== -1) {
      context.exeInfo = {};
      context.exeInfo.forcePush = false;
      const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
      if (fs.existsSync(projectConfigFilePath)) {
        context.exeInfo.projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));
      }
      const envFilePath = context.amplify.pathManager.getLocalEnvFilePath();
      context.exeInfo.localEnvInfo = JSON.parse(fs.readFileSync(envFilePath));

      if (context.exeInfo.localEnvInfo.envName !== envName) {
        context.exeInfo.localEnvInfo.envName = envName;
        const jsonString = JSON.stringify(context.exeInfo.localEnvInfo, null, 4);
        const localEnvFilePath =
          context.amplify.pathManager.getLocalEnvFilePath(context.exeInfo.localEnvInfo.projectPath);
        fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');
      }

      await initializeEnv(context);
    } else {
      context.print.error("Environment doesn't exist. Please use 'amplify init' to create a new environment");
      process.exit(1);
    }
  }


  const hasChanges = await showResourceTable(category, resourceName);

  // no changes detected
  if (!hasChanges && !context.exeInfo.forcePush) {
    context.print.info('\nNo changes detected');
    return context;
  }

  let continueToPush = context.exeInfo.inputParams.yes;
  if (!continueToPush) {
    continueToPush = await context.amplify.confirmPrompt.run('Are you sure you want to continue?');
    context.exeInfo.pushAborted = !continueToPush;
  }

  if (continueToPush) {
    try {
      // Get current-cloud-backend's amplify-meta
      const currentAmplifyMetafilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
      const currentAmplifyMeta = JSON.parse(fs.readFileSync(currentAmplifyMetafilePath));

      await providersPush(context);
      await onCategoryOutputsChange(context, currentAmplifyMeta);
    } catch (err) {
      // Handle the errors and print them nicely for the user.
      context.print.error(`\n${err.message}`);
      throw err;
    }
  }

  return context;
}

function providersPush(context, category, resourceName) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises = [];

  providers.forEach((provider) => {
    const providerModule = require(providerPlugins[provider]);
    providerPromises.push(providerModule.pushResources(context, category, resourceName));
  });

  return Promise.all(providerPromises);
}

module.exports = {
  pushResources,
};
