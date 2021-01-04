import { $TSAny, $TSContext, exitOnNextTick, ResourceDoesNotExistError, ServiceSelection } from 'amplify-cli-core';
import * as inquirer from 'inquirer';

import { getProjectConfig } from './get-project-config';
import { getProviderPlugins } from './get-provider-plugins';

type ServiceSelectionOption = {
  name: string;
  value: ServiceSelection;
};

function filterServicesByEnabledProviders(context, enabledProviders: string[], supportedServices) {
  const providerPlugins = getProviderPlugins(context);

  const filteredServices: any[] = [];

  if (supportedServices !== undefined && enabledProviders !== undefined) {
    Object.keys(supportedServices).forEach(serviceName => {
      const { provider, alias } = supportedServices[serviceName];

      if (enabledProviders.includes(provider)) {
        filteredServices.push({
          service: serviceName,
          providerPlugin: providerPlugins[provider],
          providerName: provider,
          alias: alias,
        });
      }
    });
  }

  return filteredServices;
}

async function serviceQuestionWalkthrough(
  context,
  supportedServices,
  category,
  customQuestion = null,
  optionNameOverrides?: Record<string, string>,
): Promise<ServiceSelection> {
  const options: ServiceSelectionOption[] = [];
  for (let i = 0; i < supportedServices.length; ++i) {
    let optionName = supportedServices[i].alias || `${supportedServices[i].providerName}:${supportedServices[i].service}`;

    if (optionNameOverrides && optionNameOverrides[supportedServices[i].service]) {
      optionName = optionNameOverrides[supportedServices[i].service];
    }

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

  const answer = await inquirer.prompt<{ service: ServiceSelection }>(question);

  return answer.service;
}

export function serviceSelectionPrompt(
  context: $TSContext,
  category: string,
  supportedServices: $TSAny,
  customQuestion: $TSAny = null,
  optionNameOverrides?: Record<string, string>,
): Promise<ServiceSelection> {
  const { providers } = getProjectConfig();
  supportedServices = filterServicesByEnabledProviders(context, providers, supportedServices);
  return serviceQuestionWalkthrough(context, supportedServices, category, customQuestion, optionNameOverrides);
}
