// @ts-check
const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const path = require('path');
const categoryManager = require('./lib/category-manager');
import { JSONUtilities } from 'amplify-cli-core';

const category = 'hosting';
const { generateHostingResources } = require('./lib/ElasticContainer/index');

async function add(context) {
  const { availableServices } = categoryManager.getCategoryStatus(context);
  if (availableServices) {
    await categoryManager.runServiceAction(context, availableServices[0], 'enable');
  }
}

function readPluginManifest() {
  return JSONUtilities.readJson(path.join(__dirname, '..', 'amplify-plugin.json'), { throwIfNotExist: true });
}

async function configure(context) {
  const { availableServices, enabledServices } = categoryManager.getCategoryStatus(context);
  const pluginManifest = readPluginManifest();
  if (availableServices.length > 0) {
    if (enabledServices.length > 1) {
      const answers = await inquirer.prompt({
        type: 'checkbox',
        name: 'selectedServices',
        message: 'Please select the service(s) to configure.',
        choices: enabledServices,
        default: enabledServices[0],
      });
      const tasks = [];
      answers.selectedServices.forEach(service => {
        tasks.push(() => categoryManager.runServiceAction(context, service, 'configure'));
      });
      return sequential(tasks);
    } else if (enabledServices.length === 1) {
      return categoryManager.runServiceAction(context, enabledServices[0], 'configure');
    }
    throw new Error(`No ${pluginManifest.displayName} hosting service is enabled.`);
  } else {
    throw new Error(`${pluginManifest.displayName} hosting is not available from enabled providers.`);
  }
}

function publish(context, service, args) {
  const pluginManifest = readPluginManifest();
  const { enabledServices } = categoryManager.getCategoryStatus(context);

  if (enabledServices.length > 0) {
    if (enabledServices.includes(service)) {
      return categoryManager.runServiceAction(context, service, 'publish', args);
    }
    throw new Error(`Hosting service ${service} is NOT enabled.`);
  } else {
    throw new Error(`No ${pluginManifest.displayName} hosting service is enabled.`);
  }
}

async function console(context) {
  const { availableServices, enabledServices } = categoryManager.getCategoryStatus(context);
  const pluginManifest = readPluginManifest();
  if (availableServices.length > 0) {
    if (enabledServices.length > 1) {
      const answer = await inquirer.prompt({
        type: 'list',
        name: 'selectedService',
        message: 'Please select the service.',
        choices: enabledServices,
        default: enabledServices[0],
      });
      return categoryManager.runServiceAction(context, answer.selectedService, 'console');
    } else if (enabledServices.length === 1) {
      return categoryManager.runServiceAction(context, enabledServices[0], 'console');
    }
    throw new Error(`No ${pluginManifest.displayName} hosting service is enabled.`);
  } else {
    throw new Error(`${pluginManifest.displayName} hosting is not available from enabled providers.`);
  }
}

async function migrate(context) {
  await categoryManager.migrate(context);
}

async function getPermissionPolicies(context, resourceOpsMapping) {
  const permissionPolicies = [];
  const resourceAttributes = [];

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    const { policy, attributes } = categoryManager.getIAMPolicies(resourceName, resourceOpsMapping[resourceName]);
    permissionPolicies.push(policy);
    resourceAttributes.push({ resourceName, attributes, category });
  });
  return { permissionPolicies, resourceAttributes };
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
  const pluginManifest = readPluginManifest();
  context.print.info(`${pluginManifest.displayName} hosting handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}

module.exports = {
  add,
  configure,
  publish,
  console,
  migrate,
  getPermissionPolicies,
  executeAmplifyCommand,
  handleAmplifyEvent,
  generateHostingResources,
};
