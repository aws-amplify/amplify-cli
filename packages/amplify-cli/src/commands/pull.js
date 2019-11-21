const fs = require('fs-extra');

const { pullBackend } = require('../lib/pull-backend');
const { attachBackend } = require('../lib/attach-backend');
const { constructInputParams } = require('../lib/amplify-service-helper');
const { run: envCheckout } = require('./env/checkout');

module.exports = {
  name: 'pull',
  run: async context => {
    const inputParams = constructInputParams(context);

    const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath(process.cwd());
    if (fs.existsSync(currentAmplifyMetaFilePath)) {
      const { appId: inputAppId, envName: inputEnvName } = inputParams.amplify;

      const teamProviderInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath(process.cwd());
      const localEnvInfoFilePath = context.amplify.pathManager.getLocalEnvFilePath(process.cwd());
      const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoFilePath);
      const { envName } = context.amplify.readJsonFile(localEnvInfoFilePath);
      const { AmplifyAppId } = teamProviderInfo[envName].awscloudformation;
      const localEnvNames = Object.keys(teamProviderInfo);

      if (inputAppId && AmplifyAppId && inputAppId !== AmplifyAppId) {
        context.print.error('Amplify appId mismatch.');
        context.print.info(`You are currently working in the amplify project with Id ${AmplifyAppId}`);
        process.exit(1);
      }

      if (inputEnvName) {
        if (inputEnvName === envName) {
          await pullBackend(context, inputParams);
        } else if (localEnvNames.includes(inputEnvName)) {
          context.parameters.options = {};
          context.parameters.first = inputEnvName;
          await envCheckout(context);
        } else {
          inputParams.amplify.appId = inputAppId;
          await attachBackend(context, inputParams);
        }
      } else {
        await pullBackend(context, inputParams);
      }
    } else {
      await attachBackend(context, inputParams);
    }
  },
};
