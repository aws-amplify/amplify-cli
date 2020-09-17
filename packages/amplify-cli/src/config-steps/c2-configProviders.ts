import inquirer, { CheckboxQuestion } from 'inquirer';
import sequential from 'promise-sequential';
import { getProviderPlugins } from '../extensions/amplify-helpers/get-provider-plugins';
import { normalizeProviderName } from '../input-params-manager';

export async function configProviders(context) {
  const providerPlugins = getProviderPlugins(context);
  const { providers: currentProviders } = context.exeInfo.projectConfig;

  const selectedProviders = await configureProviders(context, providerPlugins, currentProviders);

  const configTasks: (() => Promise<any>)[] = [];
  const initializationTasks: (() => Promise<any>)[] = [];
  const onInitSuccessfulTasks: (() => Promise<any>)[] = [];

  selectedProviders.forEach(provider => {
    const providerModule = require(providerPlugins[provider]);
    if (currentProviders.includes(provider)) {
      configTasks.push(() => providerModule.configure(context));
    } else {
      initializationTasks.push(() => providerModule.init(context));
      onInitSuccessfulTasks.push(() => providerModule.onInitSuccessful(context));
    }
  });

  await sequential(configTasks);
  await sequential(initializationTasks);
  await sequential(onInitSuccessfulTasks);

  return context;
}

async function configureProviders(context, providerPlugins, currentProviders) {
  let providers: any = [];
  const providerPluginList = Object.keys(providerPlugins);
  const { inputParams } = context.exeInfo;
  if (inputParams.amplify.providers) {
    inputParams.amplify.providers.forEach(provider => {
      provider = normalizeProviderName(provider, providerPluginList);
      if (provider) {
        providers.push(provider);
      }
    });
  }

  if (providers.length === 0) {
    if (inputParams.yes || providerPluginList.length === 1) {
      context.print.info(`Using default provider  ${providerPluginList[0]}`);
      providers.push(providerPluginList[0]);
    } else {
      const selectProviders: CheckboxQuestion<{ selectedProviders: [] }> = {
        type: 'checkbox',
        name: 'selectedProviders',
        message: 'Select the backend providers.',
        choices: providerPluginList,
        default: currentProviders,
      };
      const answer = await inquirer.prompt(selectProviders);
      providers = answer.selectedProviders;
    }
  }
  return providers;
}
