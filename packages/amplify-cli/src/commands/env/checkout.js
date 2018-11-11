const fs = require('fs');
const { initializeEnv } = require('../../lib/initialize-env');

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
    const localEnvInfo = JSON.parse(fs.readFileSync(localEnvFilePath));
    localEnvInfo.envName = envName;
    const jsonString = JSON.stringify(localEnvInfo, null, 4);
    fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');

    // Initialize the environment

    context.amplify.constructExeInfo(context);
    context.exeInfo.forcePush = false;
    context.exeInfo.restoreBackend = context.parameters.options.restore;

    await initializeEnv(context);
  },
};
