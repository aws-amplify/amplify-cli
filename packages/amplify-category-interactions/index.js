const path = require('path');

const category = 'interactions';

async function migrate(context) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach(categoryName => {
    if (categoryName === category) {
      Object.keys(amplifyMeta[category]).forEach(resourceName => {
        try {
          const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
          if (providerController) {
            migrateResourcePromises.push(
              providerController.migrateResource(context, projectPath, amplifyMeta[category][resourceName].service, resourceName)
            );
          } else {
            context.print.error(`Provider not configured for ${category}: ${resourceName}`);
          }
        } catch (e) {
          context.print.warning(`Could not run migration for ${category}: ${resourceName}`);
          throw e;
        }
      });
    }
  });

  await Promise.all(migrateResourcePromises);
}

async function getPermissionPolicies(context, resourceOpsMapping) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies = [];
  const resourceAttributes = [];

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    try {
      const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
      if (providerController) {
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          amplifyMeta[category][resourceName].service,
          resourceName,
          resourceOpsMapping[resourceName]
        );
        permissionPolicies.push(policy);
        resourceAttributes.push({ resourceName, attributes, category });
      } else {
        context.print.error(`Provider not configured for ${category}: ${resourceName}`);
      }
    } catch (e) {
      context.print.warning(`Could not get policies for ${category}: ${resourceName}`);
      throw e;
    }
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
  context.print.info(`${category} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}

module.exports = {
  migrate,
  getPermissionPolicies,
  executeAmplifyCommand,
  handleAmplifyEvent,
};
