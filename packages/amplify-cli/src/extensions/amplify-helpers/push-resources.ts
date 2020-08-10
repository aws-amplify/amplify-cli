<<<<<<< HEAD:packages/amplify-cli/src/extensions/amplify-helpers/push-resources.ts
import { getProjectConfig } from './get-project-config';
import { showResourceTable } from './resource-status';
import { onCategoryOutputsChange } from './on-category-outputs-change';
import { initializeEnv } from '../../initialize-env';
import { getProviderPlugins } from './get-provider-plugins';
import { getEnvInfo } from './get-env-info';
import { stateManager } from 'amplify-cli-core';
=======
const fs = require('fs-extra');
const { getProjectConfig } = require('./get-project-config');
const { showResourceTable, checkChangesInTags } = require('./resource-status');
const { onCategoryOutputsChange } = require('./on-category-outputs-change');
const { initializeEnv } = require('../../initialize-env');
const { getProviderPlugins } = require('./get-provider-plugins');
const { getEnvInfo } = require('./get-env-info');
const { readJsonFile } = require('./read-json-file');
>>>>>>> feat: inital version for detecting local tag changes:packages/amplify-cli/src/extensions/amplify-helpers/push-resources.js

/*
context: Object // Required
category: String // Optional
resourceName: String // Optional
filteredResources: [{category: String, resourceName: String}] // Optional
*/

export async function pushResources(context, category, resourceName, filteredResources) {
  if (context.parameters.options.env) {
    const envName = context.parameters.options.env;
    const allEnvs = context.amplify.getAllEnvs(context);
    if (allEnvs.findIndex(env => env === envName) !== -1) {
      context.exeInfo = {};
      context.exeInfo.forcePush = false;

      context.exeInfo.projectConfig = stateManager.getProjectConfig(undefined, {
        throwIfNotExist: false,
      });

      context.exeInfo.localEnvInfo = getEnvInfo();

      if (context.exeInfo.localEnvInfo.envName !== envName) {
        context.exeInfo.localEnvInfo.envName = envName;

        stateManager.setLocalEnvInfo(context.exeInfo.localEnvInfo.projectPath, context.exeInfo.localEnvInfo);
      }

      await initializeEnv(context);
    } else {
      context.print.error("Environment doesn't exist. Please use 'amplify init' to create a new environment");
      process.exit(1);
    }
  }

  // ! changed this from 'const' to 'let', since it makes it easire when it comes to checking changes in the local tags file
  let hasChanges = await showResourceTable(category, resourceName, filteredResources);

  // Check if there have been changes in the local tags file
  let haveTagsChanged = await checkChangesInTags(context);

  // if there are changes in the local tags file, let the user push to the cloud
  if (haveTagsChanged) {
    hasChanges += 1;
    context.print.info('\nChanges in the local tags.json file detected\n');
  }

  // no changes detected
  if (!hasChanges && !context.exeInfo.forcePush) {
    context.print.info('\nNo changes detected');
    return context;
  }

  let continueToPush = context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes;
  if (!continueToPush) {
    continueToPush = await context.amplify.confirmPrompt('Are you sure you want to continue?');
  }

  if (continueToPush) {
    try {
      // Get current-cloud-backend's amplify-meta
      const currentAmplifyMeta = stateManager.getCurrentMeta();

      await providersPush(context, category, resourceName, filteredResources);
      await onCategoryOutputsChange(context, currentAmplifyMeta);
    } catch (err) {
      // Handle the errors and print them nicely for the user.
      context.print.error(`\n${err.message}`);
      throw err;
    }
  }

  return continueToPush;
}

async function providersPush(context, category, resourceName, filteredResources) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises: (() => Promise<any>)[] = [];

  for (let i = 0; i < providers.length; i += 1) {
    const providerModule = require(providerPlugins[providers[i]]);
    const resourceDefiniton = await context.amplify.getResourceStatus(category, resourceName, providers[i], filteredResources);
    providerPromises.push(providerModule.pushResources(context, resourceDefiniton));
  }

  await Promise.all(providerPromises);
}

export async function storeCurrentCloudBackend(context) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises: (() => Promise<any>)[] = [];

  for (let i = 0; i < providers.length; i += 1) {
    const providerModule = require(providerPlugins[providers[i]]);
    providerPromises.push(providerModule.storeCurrentCloudBackend(context));
  }

  await Promise.all(providerPromises);
}
