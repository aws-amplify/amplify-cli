import * as inquirer from 'inquirer';
import sequential from 'promise-sequential';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { normalizeProviderName } from '../input-params-manager';
import { providersMultiSelect } from '../prompts';

export async function initProviders(context) {
  const providerPlugins = getProviderPlugins(context);
  const providers = await getProviders(context, providerPlugins);
  context.exeInfo.projectConfig.providers = providers;
  const initializationTasks: (() => Promise<any>)[] = [];

  providers.forEach(provider => {
    const providerModule = require(providerPlugins[provider]);
    initializationTasks.push(() => providerModule.init(context));
  });

  await sequential(initializationTasks);

  return context;
}

async function getProviders(context, providerPlugins) {
  let providers: string[] = [];
  const providerPluginList = Object.keys(providerPlugins);

  if (providerPluginList.length === 0) {
    const errorMessage = 'Found no provider plugins';
    context.print.error(errorMessage);
    context.print.info("Run 'amplify plugin scan' to scan your system for provider plugins.");
    throw new Error(errorMessage);
  }

  const { inputParams } = context.exeInfo;
  if (inputParams && inputParams.amplify && inputParams.amplify.providers) {
    inputParams.amplify.providers.forEach(provider => {
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
      providers = await providersMultiSelect(providerPluginList, providerPluginList[0]);
    }
  }
  return providers;
}
