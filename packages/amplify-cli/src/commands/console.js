const fs = require('fs-extra');
const open = require('open');

const providerName = 'awscloudformation';

module.exports = {
  name: 'console',
  run: async context => {
    let consoleUrl = getDefaultURL();

    try {
      const localEnvInfoFilePath = context.amplify.pathManager.getLocalEnvFilePath();
      if (fs.existsSync(localEnvInfoFilePath)) {
        const teamProviderInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath();
        if (fs.existsSync(teamProviderInfoFilePath)) {
          const localEnvInfo = context.amplify.readJsonFile(localEnvInfoFilePath);
          const teamProviderInfo = context.amplify.readJsonFile(teamProviderInfoFilePath);
          const { envName } = localEnvInfo;
          const { AmplifyAppId } = teamProviderInfo[envName][providerName];

          if (envName && AmplifyAppId) {
            consoleUrl = constructStatusURL(AmplifyAppId, envName);
          }
        }
      }
    } catch (e) {
      context.print.error(e.message);
    }

    context.print.green(consoleUrl);
    open(consoleUrl, { wait: false });
  },
};

function constructStatusURL(appId, envName) {
  const prodURL = `https://console.aws.amazon.com/amplify/home#/${appId}/YmFja2VuZA/${envName}`; // eslint-disable-line
  return prodURL;
}

function getDefaultURL() {
  const prodURL = `https://console.aws.amazon.com/amplify/home#/create`; // eslint-disable-line
  return prodURL;
}
