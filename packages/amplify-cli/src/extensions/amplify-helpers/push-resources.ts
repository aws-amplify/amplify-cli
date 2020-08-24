import { getProjectConfig } from './get-project-config';
import { showResourceTable } from './resource-status';
import { onCategoryOutputsChange } from './on-category-outputs-change';
import { initializeEnv } from '../../initialize-env';
import { getProviderPlugins } from './get-provider-plugins';
import { getEnvInfo } from './get-env-info';
import { stateManager } from 'amplify-cli-core';
import { isValidJSON, isWithinLimit, checkDuplicates, hasValidTags } from './tags-validation';

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

  // This is where we are validating the tags.json file
  // I placed it so it runs the validation as soon as possible, since I believe it should be one of the first things to do before continuing with the push logic.
  validateTags(context);

  const tagVarMetadata = {
    name: context.exeInfo.projectConfig.projectName,
    env: context.exeInfo.localEnvInfo.envName,
    cli: context.pluginPlatform.plugins.core[0].packageVersion,
  };

  const hasChanges = await showResourceTable(category, resourceName, filteredResources);

  // Check if there have been changes in the local tags file
  // let haveTagsChanged = await checkChangesInTags(tagVarMetadata);

  // if there are changes in the local tags file, let the user know
  // if (haveTagsChanged) {
  //   hasChanges += 1;
  //   context.print.info('\nChanges in the local tags.json file detected\n');
  // }

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

function validateTags(context) {
  const tagsPath = context.amplify.pathManager.getTagsConfigFilePath();
  const tagsJson = context.amplify.readJsonFile(tagsPath);

  try {
    isValidJSON(tagsJson);
    hasValidTags(tagsJson);
    isWithinLimit(tagsJson);
    checkDuplicates(tagsJson);
  } catch (err) {
    context.print.error(`Invalid tags.json file: ${err.message}`);
    throw err;
  }
}
