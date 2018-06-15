const inquirer = require('inquirer');
const { getProviderPlugins } = require('./get-provider-plugins');

function filterServicesByEnabledProviders(providerPlugins, supportedServices) {
  const filteredServices = [];

  Object.keys(supportedServices).forEach((service) => {
    if (providerPlugins[supportedServices[service].provider]) {
      filteredServices.push({
        service,
        providerPlugin: providerPlugins[supportedServices[service].provider],
        providerName: supportedServices[service].provider,
      });
    }
    /* const provider = providerPlugins.find(providerItem => providerItem.plugin ===
      supportedServices[service].provider);
    if (provider !== undefined) {
      filteredServices.push({
        service,
        provider,
      });
    } */
  });

  return filteredServices;
}

function serviceQuestionWalkthrough(context, supportedServices, category) {
  const options = [];

  for (let i = 0; i < supportedServices.length; i += 1) {
    options.push({
      name: `${supportedServices[i].providerName}:${supportedServices[i].service}`,
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
    message: 'Please select from one of the above mentioned services',
    type: 'list',
    choices: options,
  }];

  return inquirer.prompt(question)
    .then(answer => answer.service);
}

function serviceSelectionPrompt(context, category, supportedServices) {
  const providerPlugins = getProviderPlugins();
  supportedServices = filterServicesByEnabledProviders(providerPlugins, supportedServices);

  return serviceQuestionWalkthrough(context, supportedServices, category);
}

module.exports = {
  serviceSelectionPrompt,
};
