import ora from 'ora';
import { getProviderPlugins } from './get-provider-plugins';

const spinner = ora('Building resources. This may take a few minutes...');

export function buildResources(context, category, resourceName) {
  const confirmationPromise =
    context.input.options && context.input.options.yes
      ? Promise.resolve(true)
      : context.amplify.confirmPrompt('Are you sure you want to continue building the resources?');

  return confirmationPromise
    .then(answer => {
      if (answer) {
        const providerPlugins = getProviderPlugins(context);
        const providerPromises: (() => Promise<any>)[] = [];

        Object.keys(providerPlugins).forEach(provider => {
          const pluginModule = require(providerPlugins[provider]);
          providerPromises.push(pluginModule.buildResources(context, category, resourceName));
        });

        spinner.start();
        return Promise.all(providerPromises);
      }
    })
    .then(() => spinner.succeed('All resources are built.'))
    .catch(err => {
      spinner.fail('An error occurred when building the resources.');
      throw err;
    });
}
