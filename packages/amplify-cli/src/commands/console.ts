import { stateManager, open, $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';

const providerName = 'awscloudformation';

/**
 * Entry point for console command
 */
export const run = async (context: $TSContext): Promise<void> => {
  let consoleUrl = getDefaultURL();

  const localEnvInfo = stateManager.getLocalEnvInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  const { envName } = localEnvInfo;
  // eslint-disable-next-line no-unsafe-optional-chaining
  const { Region, AmplifyAppId } = stateManager.getMeta()?.providers?.[providerName];

  if (envName && AmplifyAppId) {
    consoleUrl = constructStatusURL(Region, AmplifyAppId, envName);
    const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
    const { isAdminApp } = await providerPlugin.isAmplifyAdminApp(AmplifyAppId);
    if (isAdminApp) {
      const choice = await prompter.pick('Which site do you want to open?', ['Amplify Studio', 'AWS console']);
      if (choice === 'Amplify Studio') {
        const baseUrl = providerPlugin.adminBackendMap[Region].amplifyAdminUrl;
        consoleUrl = constructAdminURL(baseUrl, AmplifyAppId, envName);
      }
    }
  }

  printer.info(chalk.green(consoleUrl));
  await open(consoleUrl, { wait: false });
};

const constructAdminURL = (baseUrl: string, appId: string, envName: string): string => `${baseUrl}/admin/${appId}/${envName}/home`;

const constructStatusURL = (region: string, appId: string, envName: string): string => {
  // eslint-disable-next-line spellcheck/spell-checker
  const prodURL = `https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}/YmFja2VuZA/${envName}`;
  return prodURL;
};

const getDefaultURL = (): string => {
  const prodURL = 'https://console.aws.amazon.com/amplify/home#/create';
  return prodURL;
};
