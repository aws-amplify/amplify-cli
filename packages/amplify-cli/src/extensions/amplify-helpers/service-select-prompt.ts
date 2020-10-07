import * as inquirer from 'inquirer';
import { getProjectConfig } from './get-project-config';
import { getProviderPlugins } from './get-provider-plugins';
import { ResourceDoesNotExistError, exitOnNextTick } from 'amplify-cli-core';

function filterServicesByEnabledProviders(context, enabledProviders, supportedServices) {
  const providerPlugins = getProviderPlugins(context);

  const filteredServices: any[] = [];

  Object.keys(supportedServices).forEach(service => {
    if (enabledProviders.includes(supportedServices[service].provider)) {
      filteredServices.push({
        service,
        providerPlugin: providerPlugins[supportedServices[service].provider],
        providerName: supportedServices[service].provider,
        alias: supportedServices[service].alias,
      });
    }
  });

  return filteredServices;
}

function serviceQuestionWalkthrough(context, supportedServices, category, customQuestion = null) {
  const options: any[] = [];
  for (let i = 0; i < supportedServices.length; ++i) {
    const optionName = supportedServices[i].alias || `${supportedServices[i].providerName}:${supportedServices[i].service}`;
    options.push({
      name: optionName,
      value: {
        provider: supportedServices[i].providerPlugin,
        service: supportedServices[i].service,
        providerName: supportedServices[i].providerName,
      },
    });
  }

  if (options.length === 0) {
    const errMessage = `No services defined by configured providers for category: ${category}`;
    context.print.error(errMessage);
    context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(1);
  }
  if (options.length === 1) {
    // No need to ask questions
    context.print.info(`Using service: ${options[0].value.service}, provided by: ${options[0].value.providerName}`);
    return new Promise(resolve => {
      resolve(options[0].value);
    });
  }

  const question = [
    {
      name: 'service',
      message: customQuestion || 'Please select from one of the below mentioned services:',
      type: 'list',
      choices: options,
    },
  ];

  return inquirer.prompt(question).then(answer => answer.service);
}

export function serviceSelectionPrompt(context, category, supportedServices, customQuestion = null) {
  const { providers } = getProjectConfig();
  supportedServices = filterServicesByEnabledProviders(context, providers, supportedServices);
  return serviceQuestionWalkthrough(context, supportedServices, category, customQuestion);
}
