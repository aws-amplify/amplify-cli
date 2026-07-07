import { $TSAny, AmplifyError } from '@aws-amplify/amplify-cli-core';
import * as inquirer from 'inquirer';
import sequential from 'promise-sequential';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { normalizeProviderName } from '../input-params-manager';

/**
 * Initializes the backend providers
 */
export const initProviders = async (context): Promise<void> => {
  const providerPlugins = getProviderPlugins(context);
  const providers = await getProviders(context, providerPlugins);
  context.exeInfo.projectConfig.providers = providers;
  const initializationTasks: (() => Promise<$TSAny>)[] = [];

  for (const provider of providers) {
    const providerModule = await import(providerPlugins[provider]);
    initializationTasks.push(() => providerModule.init(context));
  }

  await sequential(initializationTasks);
  return context;
};

const getProviders = async (context, providerPlugins): Promise<$TSAny> => {
  let providers: string[] = [];
  const providerPluginList = Object.keys(providerPlugins);

  if (providerPluginList.length === 0) {
    throw new AmplifyError('ProjectInitError', {
      message: 'Found no provider plugins',
      resolution: `Run 'amplify plugin scan' to scan your system for provider plugins.`,
    });
  }

  const { inputParams } = context.exeInfo;
  if (inputParams && inputParams.amplify && inputParams.amplify.providers) {
    inputParams.amplify.providers.forEach((provider) => {
      // eslint-disable-next-line no-param-reassign
      provider = normalizeProviderName(provider, providerPluginList);
      if (provider) {
        providers.push(provider);
      }
    });
  }

  if (providers.length === 0) {
    if ((inputParams && inputParams.yes) || providerPluginList.length === 1) {
      context.print.info(`Using default provider  ${providerPluginList[0]}`);
      providers.push(providerPluginList[0]);
    } else {
      const selectProviders: inquirer.CheckboxQuestion = {
        type: 'checkbox',
        name: 'selectedProviders',
        message: 'Select the backend providers.',
        choices: providerPluginList,
        default: providerPluginList[0],
      };
      const answer = await inquirer.prompt(selectProviders);
      providers = answer.selectedProviders;
    }
  }
  return providers;
};
