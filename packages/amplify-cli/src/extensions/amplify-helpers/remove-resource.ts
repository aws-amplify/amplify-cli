import * as path from 'path';
import * as inquirer from 'inquirer';
import _ from 'lodash';
import { stateManager, $TSContext, pathManager, ResourceDoesNotExistError, MissingParametersError, exitOnNextTick } from 'amplify-cli-core';
import { updateBackendConfigAfterResourceRemove } from './update-backend-config';
import { removeResourceParameters } from './envResourceParams';

export async function forceRemoveResource(context: $TSContext, category, name, dir) {
  const amplifyMeta = stateManager.getMeta();

  if (!amplifyMeta[category] || Object.keys(amplifyMeta[category]).length === 0) {
    context.print.error('No resources added for this category');
    context.usageData.emitError(new ResourceDoesNotExistError());
    exitOnNextTick(1);
  }

  if (!context || !category || !name || !dir) {
    context.print.error('Unable to force removal of resource: missing parameters');
    context.usageData.emitError(new MissingParametersError());
    exitOnNextTick(1);
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

export async function removeResource(
  context: $TSContext,
  category,
  resourceName,
  questionOptions: { serviceSuffix?; serviceDeletionInfo?: [] } = {},
) {
  const amplifyMeta = stateManager.getMeta();

  if (!amplifyMeta[category] || Object.keys(amplifyMeta[category]).filter(r => !!amplifyMeta[category][r].providerPlugin).length === 0) {
    context.print.error('No resources added for this category');
    context.usageData.emitError(new ResourceDoesNotExistError());
    exitOnNextTick(1);
  }

  let enabledCategoryResources: { name; value } | { name; value }[] | string[] = Object.keys(amplifyMeta[category]).filter(
    r => !!amplifyMeta[category][r].providerPlugin,
  );

  if (resourceName) {
    if (!enabledCategoryResources.includes(resourceName)) {
      const errMessage = `Resource ${resourceName} has not been added to ${category}`;
      context.print.error(errMessage);
      context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
      exitOnNextTick(1);
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
  const service = _.get(amplifyMeta, [category, resourceName, 'service']);
  const serviceType = _.get(amplifyMeta, [category, resourceName, 'serviceType']);

  if (_.has(questionOptions, ['serviceDeletionInfo', service])) {
    context.print.info(questionOptions.serviceDeletionInfo![service]);
  }

  const resourceDir = path.normalize(path.join(pathManager.getBackendDirPath(), category, resourceName));

  let promptText =
    'Are you sure you want to delete the resource? This action deletes all files related to this resource from the backend directory.';

  // For imported resources we have to show a different message to ensure customers that resource
  // will NOT be deleted in the cloud.
  if (serviceType === 'imported') {
    promptText =
      'Are you sure you want to unlink this imported resource from this Amplify backend environment? The imported resource itself will not be deleted.';
  }

  const confirm = (context.input.options && context.input.options.yes) || (await context.amplify.confirmPrompt(promptText));

  if (!confirm) {
    return;
  }

  try {
    return deleteResourceFiles(context, category, resourceName, resourceDir);
  } catch (err) {
    context.print.info(err.stack);
    context.print.error('An error occurred when removing the resources from the local directory');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
}

const deleteResourceFiles = async (context, category, resourceName, resourceDir, force?) => {
  const amplifyMeta = stateManager.getMeta();
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

  stateManager.setMeta(undefined, amplifyMeta);

  // Remove resource directory from backend/
  context.filesystem.remove(resourceDir);

  removeResourceParameters(context, category, resourceName);
  updateBackendConfigAfterResourceRemove(category, resourceName);

  context.print.success('Successfully removed resource');
  return resourceValues;
};
