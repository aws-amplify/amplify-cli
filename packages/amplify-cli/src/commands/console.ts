import { prompt } from 'enquirer';
import { stateManager, open } from 'amplify-cli-core';

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
      const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
      if (await providerPlugin.isAmplifyAdminApp(AmplifyAppId)) {
        const { choice } = await prompt<{ choice: string }>({
          type: 'select',
          name: 'choice',
          message: 'Which site do you want to open?',
          choices: [
            { name: 'Admin', message: 'Amplify admin UI' },
            { name: 'Console', message: 'Amplify console' },
          ],
        });
        if (choice === 'Admin') {
          const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
          const baseUrl = providerPlugin.adminBackendMap[Region].amplifyAdminUrl;
          consoleUrl = constructAdminURL(baseUrl, AmplifyAppId, envName);
        }
      }
    }
  } catch (e) {
    context.print.error(e.message);
    context.usageData.emitError(e);
    process.exitCode = 1;
    return;
  }

  context.print.green(consoleUrl);
  open(consoleUrl, { wait: false });
};

function constructAdminURL(baseUrl: string, appId: string, envName: string) {
  return `${baseUrl}/admin/${appId}/${envName}/home`;
}

function constructStatusURL(region, appId, envName) {
  const prodURL = `https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}/YmFja2VuZA/${envName}`; // eslint-disable-line
  return prodURL;
}

function getDefaultURL() {
  const prodURL = `https://console.aws.amazon.com/amplify/home#/create`; // eslint-disable-line
  return prodURL;
}
