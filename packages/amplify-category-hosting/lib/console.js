const inquirer = require('inquirer');
const categoryManager = require('./category-manager');

async function run(context) {
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
  run,
};
