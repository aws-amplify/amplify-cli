import open from 'open';
import { stateManager } from 'amplify-cli-core';

const providerName = 'awscloudformation';

export const run = async context => {
  let consoleUrl = getDefaultURL();

  try {
    const localEnvInfo = stateManager.getLocalEnvInfo(undefined, {
      throwIfNotExist: false,
      default: {},
    });

    const teamProviderInfo = stateManager.getTeamProviderInfo(undefined, {
      throwIfNotExist: false,
      default: {},
    });

    const { envName } = localEnvInfo;
    const { AmplifyAppId } = teamProviderInfo[envName][providerName];

    if (envName && AmplifyAppId) {
      consoleUrl = constructStatusURL(AmplifyAppId, envName);
    }
  } catch (e) {
    context.print.error(e.message);
  }

  context.print.green(consoleUrl);
  open(consoleUrl, { wait: false });
};

function constructStatusURL(appId, envName) {
  const prodURL = `https://console.aws.amazon.com/amplify/home#/${appId}/YmFja2VuZA/${envName}`; // eslint-disable-line
  return prodURL;
}

function getDefaultURL() {
  const prodURL = `https://console.aws.amazon.com/amplify/home#/create`; // eslint-disable-line
  return prodURL;
}
