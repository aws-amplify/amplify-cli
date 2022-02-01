import { stateManager, open } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import chalk from 'chalk';

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
        const choice = await prompter.pick('Which site do you want to open?', ['Amplify Studio', 'AWS console']);
        if (choice === 'Amplify Studio') {
          const baseUrl = providerPlugin.adminBackendMap[Region].amplifyAdminUrl;
          consoleUrl = constructAdminURL(baseUrl, AmplifyAppId, envName);
        }
      }
    }
  } catch (e) {
    printer.error(e.message);
    context.usageData.emitError(e);
    process.exitCode = 1;
    return;
  }

  printer.info(chalk.green(consoleUrl));
  open(consoleUrl, { wait: false });
};

function constructAdminURL(baseUrl: string, appId: string, envName: string) {
  return `${baseUrl}/admin/${appId}/${envName}/home`;
}

function constructStatusURL(region: string, appId: string, envName: string) {
  const prodURL = `https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}/YmFja2VuZA/${envName}`; // eslint-disable-line
  return prodURL;
}

function getDefaultURL() {
  const prodURL = `https://console.aws.amazon.com/amplify/home#/create`; // eslint-disable-line
  return prodURL;
}
