const inquirer = require('inquirer');
const sequential = require('promise-sequential');
const categoryManager = require('./lib/category-manager');
const consoleCommand = require('./lib/console');

async function add(context) {
  const {
    availableServices,
    disabledServices,
  } = categoryManager.getCategoryStatus(context);

  if (availableServices.length > 0) {
    if (disabledServices.length > 1) {
      const answers = await inquirer.prompt({
        type: 'checkbox',
        name: 'selectedServices',
        message: 'Please select the service(s) to add.',
        choices: disabledServices,
        default: disabledServices[0],
      });
      const tasks = [];
      answers.selectedServices.forEach((service) => {
        tasks.push(() => categoryManager.runServiceAction(context, service, 'enable'));
      });
      return sequential(tasks);
    } else if (disabledServices.length === 1) {
      return categoryManager.runServiceAction(context, disabledServices[0], 'enable');
    }
    throw new Error('Hosting is already fully enabled.');
  } else {
    throw new Error('Hosting is not available from enabled providers.');
  }
}

async function configure(context) {
  const {
    availableServices,
    enabledServices,
  } = categoryManager.getCategoryStatus(context);

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
      answers.selectedServices.forEach((service) => {
        tasks.push(() => categoryManager.runServiceAction(context, service, 'configure'));
      });
      return sequential(tasks);
    } else if (enabledServices.length === 1) {
      return categoryManager.runServiceAction(context, enabledServices[0], 'configure');
    }
    throw new Error('No hosting service is enabled.');
  } else {
    throw new Error('Hosting is not available from enabled providers.');
  }
}

function publish(context, service, args) {
  const {
    enabledServices,
  } = categoryManager.getCategoryStatus(context);

  if (enabledServices.length > 0) {
    if (enabledServices.includes(service)) {
      return categoryManager.runServiceAction(context, service, 'publish', args);
    }
    throw new Error(`Hosting service ${service} is NOT enabled.`);
  } else {
    throw new Error('No hosting service is enabled.');
  }
}

async function console(context) {
  const {
    availableServices,
    enabledServices,
  } = categoryManager.getCategoryStatus(context);

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
    throw new Error('No hosting service is enabled.');
  } else {
    throw new Error('Hosting is not available from enabled providers.');
  }
}

module.exports = {
  add,
  configure,
  publish,
  console,
};
