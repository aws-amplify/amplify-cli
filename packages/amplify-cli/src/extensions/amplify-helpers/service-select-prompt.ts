import { $TSAny, $TSContext, AmplifyError, ServiceSelection } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as inquirer from 'inquirer';

import { getProjectConfig } from './get-project-config';
import { getProviderPlugins } from './get-provider-plugins';

type ServiceSelectionOption = {
  name: string;
  value: ServiceSelection;
};

function filterServicesByEnabledProviders(context: $TSContext, enabledProviders: string[], supportedServices) {
  const providerPlugins = getProviderPlugins(context);

  const filteredServices: $TSAny[] = [];

  if (supportedServices !== undefined && enabledProviders !== undefined) {
    Object.keys(supportedServices).forEach((serviceName) => {
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
  context: $TSContext,
  supportedServices,
  category,
  customQuestion = null,
  optionNameOverrides?: Record<string, string>,
): Promise<ServiceSelection> {
  const options: ServiceSelectionOption[] = [];
  for (const supportedService of supportedServices) {
    let optionName = supportedService.alias || `${supportedService.providerName}:${supportedService.service}`;

    if (optionNameOverrides && optionNameOverrides[supportedService.service]) {
      optionName = optionNameOverrides[supportedService.service];
    }

    options.push({
      name: optionName,
      value: {
        provider: supportedService.providerPlugin,
        service: supportedService.service,
        providerName: supportedService.providerName,
      },
    });
  }

  if (options.length === 0) {
    throw new AmplifyError('ResourceDoesNotExistError', {
      message: `No services defined by configured providers for category: ${category}`,
    });
  }

  if (options.length === 1) {
    // No need to ask questions
    printer.info(`Using service: ${options[0].value.service}, provided by: ${options[0].value.providerName}`);
    return new Promise((resolve) => {
      resolve(options[0].value);
    });
  }

  const question = [
    {
      name: 'service',
      message: customQuestion || 'Select from one of the below mentioned services:',
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
