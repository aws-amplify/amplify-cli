const { AmplifyError } = require('@aws-amplify/amplify-cli-core');
const { prompter } = require('@aws-amplify/amplify-prompts');
const sequential = require('promise-sequential');
const path = require('path');
const categoryManager = require('./lib/category-manager');
const pluginManifest = require('./amplify-plugin.json');

const category = 'hosting';

async function add(context) {
  const { availableServices, disabledServices } = categoryManager.getCategoryStatus(context);

  if (availableServices.length > 0) {
    if (disabledServices.length > 1) {
      const selectedServices = await prompter.pick('Please select the service(s) to add.', disabledServices, {
        initial: 0,
        returnSize: 'many',
      });
      const tasks = [];
      selectedServices.forEach((service) => {
        tasks.push(() => categoryManager.runServiceAction(context, service, 'enable'));
      });
      return sequential(tasks);
    } else if (disabledServices.length === 1) {
      return categoryManager.runServiceAction(context, disabledServices[0], 'enable');
    }

    const errorMessage = `Hosting using ${pluginManifest.displayName} is already enabled.`;
    throw new Error(errorMessage);
  } else {
    const errorMessage = `${pluginManifest.displayName} hosting is not available from enabled providers.`;
    context.print.error(errorMessage);
    throw new Error(errorMessage);
  }
}

async function configure(context) {
  const { availableServices, enabledServices } = categoryManager.getCategoryStatus(context);

  if (availableServices.length > 0) {
    if (enabledServices.length > 1) {
      const selectedServices = await prompter.pick('Please select the service(s) to configure.', enabledServices, {
        initial: 0,
        returnSize: 'many',
      });
      const tasks = [];
      selectedServices.forEach((service) => {
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
  const { enabledServices } = categoryManager.getCategoryStatus(context);
  if (enabledServices.length > 0) {
    if (enabledServices.includes(service)) {
      // checks if hosting with S3 and CloudFront and has a secure URL otherwise,
      // the user is hosting from S3 without CloudFront distribution and should throw an error
      if (service === 'S3AndCloudFront') {
        const cfnOutput = context.exeInfo?.amplifyMeta?.hosting?.S3AndCloudFront?.output;
        if (typeof cfnOutput === 'object' && (cfnOutput === undefined || cfnOutput.CloudFrontSecureURL === undefined)) {
          throw new AmplifyError('ProjectPublishError', {
            message: 'You are trying to host an application without a CloudFront distribution. This is not supported on S3 by default.',
            details:
              'Run "amplify remove hosting" to remove the current hosting configuration, then run "amplify add hosting" and choose "S3AndCloudFront" when prompted to add a new hosting setup.',
          });
        }
      }
      return categoryManager.runServiceAction(context, service, 'publish', args);
    }
    throw new Error(`Hosting service ${service} is NOT enabled.`);
  } else {
    throw new Error(`No ${pluginManifest.displayName} hosting service is enabled.`);
  }
}

async function console(context) {
  const { availableServices, enabledServices } = categoryManager.getCategoryStatus(context);

  if (availableServices.length > 0) {
    if (enabledServices.length > 1) {
      const selectedService = await prompter.pick('Please select the service.', enabledServices, { initial: 0 });
      return categoryManager.runServiceAction(context, selectedService, 'console');
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

  Object.keys(resourceOpsMapping).forEach((resourceName) => {
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
};
