import open from 'open';
import { prompt } from 'enquirer';
import { stateManager } from 'amplify-cli-core';
const { doAdminCredentialsExist } = require('amplify-provider-awscloudformation');

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
    const { Region, AmplifyAppId } = teamProviderInfo[envName][providerName];

    if (envName && AmplifyAppId) {
      consoleUrl = constructStatusURL(Region, AmplifyAppId, envName);
      if (doAdminCredentialsExist(AmplifyAppId)) {
        const { choice } = await prompt<{ choice: string }>({
          type: 'select',
          name: 'choice',
          message: 'Which site do you want to open?',
          choices: [
            { name: 'admin', message: 'Amplify admin UI', value: 'admin' },
            { name: 'console', message: 'Amplify console', value: 'console' },
          ],
        });
        if (choice === 'admin') {
          consoleUrl = constructAdminURL(Region, AmplifyAppId, envName);
        }
      }
    }
  } catch (e) {
    context.print.error(e.message);
  }

  context.print.green(consoleUrl);
  open(consoleUrl, { wait: false });
};

function constructAdminURL(region: string, appId: string, envName: string) {
  return `https://www.dracarys.app/admin/${appId}/${envName}/home`;
}

function constructStatusURL(region, appId, envName) {
  const prodURL = `https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}/YmFja2VuZA/${envName}`; // eslint-disable-line
  return prodURL;
}

function getDefaultURL() {
  const prodURL = `https://console.aws.amazon.com/amplify/home#/create`; // eslint-disable-line
  return prodURL;
}
