const fs = require('fs');
const sequential = require('promise-sequential');
const { initializeEnv } = require('../../lib/initialize-env');
const { getProviderPlugins } = require('../../extensions/amplify-helpers/get-provider-plugins');
const { getEnvInfo } = require('../../extensions/amplify-helpers/get-env-info');

module.exports = {
  name: 'checkout',
  run: async (context) => {
    const envName = context.parameters.first;

    // Check if environment exists

    const allEnvs = context.amplify.getEnvDetails();
    if (!envName || !allEnvs[envName]) {
      context.print.error('Please pass in a valid environment name. Run amplify env list to get a list of valid environments');
      return;
    }

    // Set the current env to the environment name provided

    const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath();
    const localEnvInfo = getEnvInfo();
    localEnvInfo.envName = envName;
    const jsonString = JSON.stringify(localEnvInfo, null, 4);
    fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');

    // Setup exeinfo

    context.amplify.constructExeInfo(context);
    context.exeInfo.forcePush = false;
    context.exeInfo.isNewEnv = false;
    context.exeInfo.restoreBackend = context.parameters.options.restore;

    // Setup Provider creds/info
    const initializationTasks = [];
    const providerPlugins = getProviderPlugins(context);
    context.exeInfo.projectConfig.providers.forEach((provider) => {
      const providerModule = require(providerPlugins[provider]);
      initializationTasks.push(() => providerModule.init(
        context,
        allEnvs[envName][provider],
      ));
    });

    await sequential(initializationTasks);

    const onInitSuccessfulTasks = [];
    context.exeInfo.projectConfig.providers.forEach((provider) => {
      const providerModule = require(providerPlugins[provider]);
      onInitSuccessfulTasks.push(() => providerModule.onInitSuccessful(
        context,
        allEnvs[envName][provider],
      ));
    });

    await sequential(onInitSuccessfulTasks);

    // Initialize the environment

    await initializeEnv(context);
  },
};
