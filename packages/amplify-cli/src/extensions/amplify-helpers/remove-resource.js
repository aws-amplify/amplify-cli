const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const pathManager = require('./path-manager');
const { updateBackendConfigAfterResourceRemove } = require('./update-backend-config');
const { removeResourceParameters } = require('./envResourceParams');
const _ = require('lodash');

async function forceRemoveResource(context, category, name, dir) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  if (!amplifyMeta[category] || Object.keys(amplifyMeta[category]).length === 0) {
    context.print.error('No resources added for this category');
    process.exit(1);
    return;
  }
  if (!context || !category || !name || !dir) {
    context.print.error('Unable to force removal of resource: missing parameters');
    process.exit(1);
    return;
  }
  context.print.info(`Removing resource ${name}...`);
  let response;
  try {
    response = await deleteResourceFiles(context, category, name, dir, true);
  } catch (e) {
    context.print.error('Unable to force removal of resource: error deleting files');
  }
  return response;
}

async function removeResource(context, category, resourceName, questionOptions = {}) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  if (!amplifyMeta[category] || Object.keys(amplifyMeta[category]).length === 0) {
    context.print.error('No resources added for this category');
    process.exit(1);
  }

  let enabledCategoryResources = Object.keys(amplifyMeta[category]);

  if (resourceName) {
    if (!enabledCategoryResources.includes(resourceName)) {
      context.print.error(`Resource ${resourceName} has not been added to ${category}`);
      process.exit(1);
    }
  } else {
    if (questionOptions.serviceSuffix) {
      enabledCategoryResources = enabledCategoryResources.map(resource => {
        let service = _.get(amplifyMeta, [category, resource, 'service']);
        let suffix = _.get(questionOptions, ['serviceSuffix', service], '');
        return { name: `${resource} ${suffix}`, value: resource };
      });
    }
    const question = [
      {
        name: 'resource',
        message: 'Choose the resource you would want to remove',
        type: 'list',
        choices: enabledCategoryResources,
      },
    ];
    const answer = await inquirer.prompt(question);
    resourceName = answer.resource;
  }

  context.print.info('');
  let service = _.get(amplifyMeta, [category, resourceName, 'service']);
  if (_.has(questionOptions, ['serviceDeletionInfo', service])) {
    context.print.info(questionOptions.serviceDeletionInfo[service]);
  }

  const resourceDir = path.normalize(path.join(pathManager.getBackendDirPath(), category, resourceName));

  const confirm =
    (context.input.options && context.input.options.yes) ||
    (await context.amplify.confirmPrompt.run(
      'Are you sure you want to delete the resource? This action deletes all files related to this resource from the backend directory.',
    ));

  if (!confirm) return;

  try {
    return deleteResourceFiles(context, category, resourceName, resourceDir);
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('An error occurred when removing the resources from the local directory');
    context.usageData.emitError(err);
  }
}

const deleteResourceFiles = async (context, category, resourceName, resourceDir, force) => {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  if (!force) {
    const { allResources } = await context.amplify.getResourceStatus();
    allResources.forEach(resourceItem => {
      if (resourceItem.dependsOn) {
        resourceItem.dependsOn.forEach(dependsOnItem => {
          if (dependsOnItem.category === category && dependsOnItem.resourceName === resourceName) {
            context.print.error('Resource cannot be removed because it has a dependency on another resource');
            context.print.error(`Dependency: ${resourceItem.service}:${resourceItem.resourceName}`);
            throw new Error('Resource cannot be removed because it has a dependency on another resource');
          }
        });
      }
    });
  }
  const resourceValues = {
    service: amplifyMeta[category][resourceName].service,
    resourceName,
  };
  if (amplifyMeta[category][resourceName] !== undefined) {
    delete amplifyMeta[category][resourceName];
  }

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

  // Remove resource directory from backend/
  context.filesystem.remove(resourceDir);
  removeResourceParameters(context, category, resourceName);
  updateBackendConfigAfterResourceRemove(category, resourceName);

  context.print.success('Successfully removed resource');
  return resourceValues;
};

module.exports = {
  removeResource,
  forceRemoveResource,
};
