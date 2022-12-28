import {
  $TSContext,
  exitOnNextTick,
  pathManager,
  promptConfirmationRemove,
  ResourceDoesNotExistError,
  stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as inquirer from 'inquirer';
import _ from 'lodash';
import { removeResourceParameters } from './envResourceParams';
import { updateBackendConfigAfterResourceRemove } from './update-backend-config';

export async function forceRemoveResource(context: $TSContext, category: string, resourceName: string, resourceDir: string) {
  const amplifyMeta = stateManager.getMeta();

  if (!amplifyMeta[category] || Object.keys(amplifyMeta[category]).length === 0) {
    printer.error('No resources added for this category');
    await context.usageData.emitError(new ResourceDoesNotExistError('No resources added for this category'));
    exitOnNextTick(1);
  }

  printer.info(`Removing resource ${resourceName}...`);
  let response;

  try {
    response = await deleteResourceFiles(context, category, resourceName, resourceDir, true);
  } catch (e) {
    printer.error('Unable to force removal of resource: error deleting files');
  }

  return response;
}

export async function removeResource(
  context: $TSContext,
  category: string,
  resourceName?: string,
  options: {
    headless?: boolean;
    serviceSuffix?: { [serviceName: string]: string };
    serviceDeletionInfo?: { [serviceName: string]: string };
  } = { headless: false },
  resourceNameCallback?: (resourceName: string) => Promise<void>,
) {
  const amplifyMeta = stateManager.getMeta();

  if (
    !amplifyMeta[category] ||
    Object.keys(amplifyMeta[category]).filter(r => amplifyMeta[category][r].mobileHubMigrated !== true).length === 0
  ) {
    printer.error('No resources added for this category');
    await context.usageData.emitError(new ResourceDoesNotExistError('No resources added for this category'));
    exitOnNextTick(1);
  }

  let enabledCategoryResources: { name; value } | { name; value }[] | string[] = Object.keys(amplifyMeta[category]).filter(
    r => amplifyMeta[category][r].mobileHubMigrated !== true,
  );

  if (resourceName) {
    if (!enabledCategoryResources.includes(resourceName)) {
      const errMessage = `Resource ${resourceName} has not been added to ${category}`;
      printer.error(errMessage);
      await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
      exitOnNextTick(1);
    }
  } else {
    if (options.serviceSuffix) {
      enabledCategoryResources = enabledCategoryResources.map(resource => {
        const service = _.get(amplifyMeta, [category, resource, 'service']);
        const suffix = _.get(options, ['serviceSuffix', service], '');
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

    resourceName = answer.resource as string;
  }

  if (resourceNameCallback) {
    await resourceNameCallback(resourceName);
  }

  const resourceDir = pathManager.getResourceDirectoryPath(undefined, category, resourceName);

  if (options.headless !== true) {
    printer.blankLine();
    const service = _.get(amplifyMeta, [category, resourceName, 'service']);
    const serviceType = _.get(amplifyMeta, [category, resourceName, 'serviceType']);

    if (options?.serviceDeletionInfo?.[service]) {
      printer.info(options.serviceDeletionInfo[service]);
    }

    const confirm = await promptConfirmationRemove(context, serviceType);

    if (!confirm) {
      return undefined;
    }
  }

  try {
    return await deleteResourceFiles(context, category, resourceName, resourceDir);
  } catch (err) {
    if (err.stack) {
      printer.info(err.stack);
    }
    printer.error('An error occurred when removing the resources from the local directory');
    await context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return undefined;
}

const deleteResourceFiles = async (context: $TSContext, category: string, resourceName: string, resourceDir: string, force = false) => {
  const amplifyMeta = stateManager.getMeta();
  if (!force) {
    const { allResources } = await context.amplify.getResourceStatus();
    allResources.forEach(resourceItem => {
      if (resourceItem.dependsOn) {
        resourceItem.dependsOn.forEach(dependsOnItem => {
          if (dependsOnItem.category === category && dependsOnItem.resourceName === resourceName) {
            printer.error('Resource cannot be removed because it has a dependency on another resource');
            printer.error(`Dependency: ${resourceItem.service} - ${resourceItem.resourceName}`);
            const error = new Error('Resource cannot be removed because it has a dependency on another resource');
            error.stack = undefined;
            throw error;
          }
        });
      }
    });
  }
  const serviceName: string = amplifyMeta[category][resourceName].service;
  const resourceValues = {
    service: serviceName,
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

  printer.success('Successfully removed resource');
  return resourceValues;
};
