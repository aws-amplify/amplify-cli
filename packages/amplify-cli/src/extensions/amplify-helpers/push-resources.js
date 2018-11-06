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


  await showResourceTable(category, resourceName);

  return context.prompt.confirm('Are you sure you want to continue?')
    .then((answer) => {
      if (answer) {
        const { providers } = getProjectConfig();
        const providerPlugins = getProviderPlugins(context);
        const providerPromises = [];

        providers.forEach((providerName) => {
          const pluginModule = require(providerPlugins[providerName]);
          providerPromises.push(pluginModule.pushResources(context, category, resourceName));
        });

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


  await showResourceTable(category, resourceName);

  let continueToPush = context.exeInfo.inputParams.yes;
  if (!continueToPush) {
    continueToPush = await context.prompt.confirm('Are you sure you want to continue?');
  }

  if (continueToPush) {
    try {
      await providersPush(context);
      await onCategoryOutputsChange(context);
    } catch (err) {
      // Handle the errors and print them nicely for the user.
      context.print.error(`\n${err.message}`);
    }
  }

  return context;
}

function providersPush(context, category, resourceName) {
  const { providers } = context.exeInfo.projectConfig;
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
