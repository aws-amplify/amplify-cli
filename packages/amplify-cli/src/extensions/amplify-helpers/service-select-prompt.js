const inquirer = require('inquirer');
const { getProjectConfig } = require('./get-project-config');
const { getProviderPlugins } = require('./get-provider-plugins');

function filterServicesByEnabledProviders(context, enabledProviders, supportedServices) {
  const providerPlugins = getProviderPlugins(context);

  const filteredServices = [];

  Object.keys(supportedServices).forEach((service) => {
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

function serviceQuestionWalkthrough(context, supportedServices, category) {
  const options = [];

  for (let i = 0; i < supportedServices.length; i += 1) {
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
    context.print.error(`No services defined by configured providers for category: ${category}`);
    process.exit(1);
  }
  if (options.length === 1) {
    // No need to ask questions
    context.print.info(`Using service: ${options[0].value.service}, provided by: ${options[0].value.providerName}`);
    return new Promise((resolve) => {
      resolve(options[0].value);
    });
  }

  const question = [{
    name: 'service',
    message: 'Please select from one of the below mentioned services',
    type: 'list',
    choices: options,
  }];

  return inquirer.prompt(question)
    .then(answer => answer.service);
}

function serviceSelectionPrompt(context, category, supportedServices) {
  const { providers } = getProjectConfig();
  supportedServices = filterServicesByEnabledProviders(context, providers, supportedServices);
  return serviceQuestionWalkthrough(context, supportedServices, category);
}

function datasourceSelectionPrompt(context, category, supportedDatasources) {
  const options = [];
  Object.keys(supportedDatasources).forEach((datasource) => {
    const optionName = supportedDatasources[datasource].alias || `${supportedDatasources[datasource].providerName}:${supportedDatasources[datasource].service}`;
    options.push({
      name: optionName,
      value: {
        provider: supportedDatasources[datasource].provider,
        datasource,
        providerName: supportedDatasources[datasource].provider,
      },
    });
  });

  if (options.length === 0) {
    context.print.error(`No datasources defined by configured providers for category: ${category}`);
    process.exit(1);
  }

  if (options.length === 1) {
    // No need to ask questions
    context.print.info(`Using datasource: ${options[0].value.datasource}, provided by: ${options[0].value.providerName}`);
    return new Promise((resolve) => {
      resolve(options[0].value);
    });
  }

  const question = [{
    name: 'datasource',
    message: 'Please select from one of the below mentioned datasources',
    type: 'list',
    choices: options,
  }];

  return inquirer.prompt(question)
    .then(answer => answer.datasource);
}

module.exports = {
  serviceSelectionPrompt,
  datasourceSelectionPrompt,
};
