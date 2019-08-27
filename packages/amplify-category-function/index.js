
const sequential = require('promise-sequential');
const {
  updateConfigOnEnvInit,
} = require('./provider-utils/awscloudformation');

const {
  invokeFunction,
} = require('./provider-utils/awscloudformation/utils/invoke');

const {
  run,
} = require('./commands/function/invoke');

const category = 'function';

async function add(context, providerName, service, parameters) {
  const options = {
    service,
    providerPlugin: providerName,
    build: true,
  };
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not confgiured for this category');
    return;
  }
  return providerController.addResource(context, category, service, options, parameters);
}

async function update(context, providerName, service, parameters, resourceToUpdate) {
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not confgiured for this category');
    return;
  }
  return providerController.updateResource(
    context,
    category,
    service,
    parameters,
    resourceToUpdate,
  );
}

async function console(context) {
  context.print.info(`to be implemented: ${category} console`);
}

async function migrate(context) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach((categoryName) => {
    if (categoryName === category) {
      Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        try {
          const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
          if (providerController) {
            migrateResourcePromises.push(providerController.migrateResource(
              context,
              projectPath,
              amplifyMeta[category][resourceName].service,
              resourceName,
            ));
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

  Object.keys(resourceOpsMapping).forEach((resourceName) => {
    try {
      const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
      if (providerController) {
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          amplifyMeta[category][resourceName].service,
          resourceName,
          resourceOpsMapping[resourceName],
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


async function initEnv(context) {
  const { amplify } = context;
  const { resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeUpdated } = await amplify.getResourceStatus('function');

  resourcesToBeDeleted.forEach((authResource) => {
    amplify.removeResourceParameters(context, 'function', authResource.resourceName);
  });

  const tasks = resourcesToBeCreated.concat(resourcesToBeUpdated);

  const functionTasks = tasks.map((functionResource) => {
    const { resourceName } = functionResource;
    return async () => {
      const config = await updateConfigOnEnvInit(context, 'function', resourceName);
      context.amplify.saveEnvResourceParameters(context, 'function', resourceName, config);
    };
  });

  await sequential(functionTasks);
}


function invoke(options) {
  invokeFunction(options);
}

function invokeWalkthroughRun(context) {
  run(context);
}

module.exports = {
  add,
  update,
  console,
  migrate,
  initEnv,
  getPermissionPolicies,
  invoke,
  invokeWalkthroughRun,
};
