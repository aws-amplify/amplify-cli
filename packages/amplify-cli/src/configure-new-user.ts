import * as inquirer from 'inquirer';
import sequential from 'promise-sequential';
import { getProviderPlugins } from './extensions/amplify-helpers/get-provider-plugins';
import { CheckboxQuestion } from 'inquirer';

export async function configureNewUser(context) {
  const providerPlugins = getProviderPlugins(context);
  const providerPluginNames = Object.keys(providerPlugins);

  const providerSelection: CheckboxQuestion = {
    type: 'checkbox',
    name: 'selectedProviders',
    message: 'Select the backend providers.',
    choices: providerPluginNames,
  };

  const selectProviders =
    providerPluginNames.length === 1 ? Promise.resolve({ selectedProviders: providerPluginNames }) : inquirer.prompt(providerSelection);

  const { selectedProviders } = await selectProviders;
  const configTasks: (() => Promise<any>)[] = [];

  selectedProviders.forEach(providerKey => {
    const provider = require(providerPlugins[providerKey]);
    configTasks.push(() => provider.configureNewUser(context));
  });

  await sequential(configTasks);
}
