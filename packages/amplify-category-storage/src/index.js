const path = require('path');
const sequential = require('promise-sequential');
const { updateConfigOnEnvInit } = require('./provider-utils/awscloudformation');

const category = 'storage';

async function add(context, providerName, service) {
  const options = {
    service,
    providerPlugin: providerName,
  };

  const providerController = require(`./provider-utils/${providerName}`);

  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }

  return providerController.addResource(context, category, service, options);
}

async function console(context) {
  context.print.info(`to be implemented: ${category} console`);
}

async function migrate(context) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];

  Object.keys(amplifyMeta).forEach(categoryName => {
    if (categoryName === category) {
      Object.keys(amplifyMeta[category]).forEach(resourceName => {
        try {
          const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}`);

          if (providerController) {
            migrateResourcePromises.push(
              providerController.migrateResource(context, projectPath, amplifyMeta[category][resourceName].service, resourceName),
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
      const providerPlugin =
        'providerPlugin' in resourceOpsMapping[resourceName]
          ? resourceOpsMapping[resourceName].providerPlugin
          : amplifyMeta[category][resourceName].providerPlugin;
      const service =
        'service' in resourceOpsMapping[resourceName]
          ? resourceOpsMapping[resourceName].service
          : amplifyMeta[category][resourceName].service;

      if (providerPlugin) {
        const providerController = require(`./provider-utils/${providerPlugin}`);
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          service,
          resourceName,
          resourceOpsMapping[resourceName],
        );
        if (Array.isArray(policy)) {
          permissionPolicies.push(...policy);
        } else {
          permissionPolicies.push(policy);
        }
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

async function initEnv(context) {
  const { resourcesToBeSynced, allResources } = await context.amplify.getResourceStatus(category);
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
  let toBeSynced = [];

  if (resourcesToBeSynced && resourcesToBeSynced.length > 0) {
    toBeSynced = resourcesToBeSynced.filter(b => b.category === category);
  }

  toBeSynced
    .filter(storageResource => storageResource.sync === 'unlink')
    .forEach(storageResource => {
      context.amplify.removeResourceParameters(context, category, storageResource.resourceName);
    });

  let tasks = [];

  // For pull change detection for import sees a difference, to avoid duplicate tasks we don't
  // add the syncable resources, as allResources covers it, otherwise it is required for env add
  // to populate the output value and such, these sync resources have the 'refresh' sync value.
  if (!isPulling) {
    tasks = tasks.concat(toBeSynced);
  }

  // check if this initialization is happening on a pull
  if (isPulling && allResources.length > 0) {
    tasks.push(...allResources);
  }

  const storageTasks = tasks.map(storageResource => {
    const { resourceName, service } = storageResource;

    return async () => {
      const config = await updateConfigOnEnvInit(context, category, resourceName, service);

      context.amplify.saveEnvResourceParameters(context, category, resourceName, config);
    };
  });

  await sequential(storageTasks);
}

module.exports = {
  add,
  console,
  initEnv,
  migrate,
  getPermissionPolicies,
  executeAmplifyCommand,
  handleAmplifyEvent,
  category,
};
