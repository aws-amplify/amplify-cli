import { promptConsoleSupportedCategory } from './provider-utils/supportedPredictions';

const predictionsConsole = require('./provider-utils/awscloudformation/index');
const inquirer = require('inquirer');
const path = require('path');

const category = 'predictions';

async function console(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();

  return promptConsoleSupportedCategory()
    .then(async result => {
      result = result.category;
      const predictionsResources = [];
      Object.keys(amplifyMeta[category]).forEach(resourceName => {
        if (
          result.services.includes(amplifyMeta[category][resourceName].service) &&
          result.types.includes(amplifyMeta[category][resourceName][result.type])
        ) {
          predictionsResources.push({
            name: resourceName,
            value: { name: resourceName, service: amplifyMeta[category][resourceName].service },
          });
        }
      });
      if (predictionsResources.length === 0) {
        context.print.error(`No ${result.category} console supported resource found.`);
        process.exit(0);
        return;
      }
      let resourceObj = predictionsResources[0].value;
      if (predictionsResources.length > 1) {
        const resourceAnswer = await inquirer.prompt({
          type: 'list',
          name: 'resource',
          messages: `Select an ${result.category} resource`,
          choices: predictionsResources,
        });
        resourceObj = resourceAnswer.resource;
      }
      const providerController = require(`./provider-utils/${result.provider}/index`);
      if (!providerController) {
        context.print.error('Provider not configured for this category');
        return;
      }

      return providerController.console(context, resourceObj, amplifyMeta);
    })
    .catch(err => {
      context.print.error('Error opening console.');
      context.print.info(err.message);
      context.usageData.emitError(err);
    });
}

async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

async function handleAmplifyEvent(context, args) {
  context.print.info(`${category} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}

module.exports = {
  predictionsConsole,
  console,
  executeAmplifyCommand,
  handleAmplifyEvent,
};
