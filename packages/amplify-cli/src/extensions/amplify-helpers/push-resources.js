const fs = require('fs-extra');
const { getProjectConfig } = require('./get-project-config');
const { showResourceTable } = require('./resource-status');
const { onCategoryOutputsChange } = require('./on-category-outputs-change');
const { initializeEnv } = require('../../lib/initialize-env');
const { getProviderPlugins } = require('./get-provider-plugins');
const { getEnvInfo } = require('./get-env-info');
const { readJsonFile } = require('./read-json-file');

/*
context: Object // Required
category: String // Optional
resourceName: String // Optional
filteredResources: [{category: String, resourceName: String}] // Optional
*/

async function pushResources(context, category, resourceName, filteredResources) {
  if (context.parameters.options.env) {
    const envName = context.parameters.options.env;
    const allEnvs = context.amplify.getAllEnvs(context);
    if (allEnvs.findIndex(env => env === envName) !== -1) {
      context.exeInfo = {};
      context.exeInfo.forcePush = false;
      const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath();
      if (fs.existsSync(projectConfigFilePath)) {
        context.exeInfo.projectConfig = readJsonFile(projectConfigFilePath);
      }
      context.exeInfo.localEnvInfo = getEnvInfo();

      if (context.exeInfo.localEnvInfo.envName !== envName) {
        context.exeInfo.localEnvInfo.envName = envName;
        const jsonString = JSON.stringify(context.exeInfo.localEnvInfo, null, 4);
        const localEnvFilePath = context
          .amplify
          .pathManager
          .getLocalEnvFilePath(context.exeInfo.localEnvInfo.projectPath);
        fs.writeFileSync(localEnvFilePath, jsonString, 'utf8');
      }

      await initializeEnv(context);
    } else {
      context.print.error("Environment doesn't exist. Please use 'amplify init' to create a new environment");
      process.exit(1);
    }
  }

  const hasChanges = await showResourceTable(category, resourceName, filteredResources);

  // no changes detected
  if (!hasChanges && !context.exeInfo.forcePush) {
    context.print.info('\nNo changes detected');
    return context;
  }

  let continueToPush =
    context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes;
  if (!continueToPush) {
    continueToPush = await context.amplify.confirmPrompt.run('Are you sure you want to continue?');
  }

  if (continueToPush) {
    try {
      // Get current-cloud-backend's amplify-meta
      const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
      const currentAmplifyMeta = readJsonFile(currentAmplifyMetaFilePath);

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
  const providerPromises = [];

  for (let i = 0; i < providers.length; i += 1) {
    const providerModule = require(providerPlugins[providers[i]]);
    const resourceDefiniton = await context.amplify.getResourceStatus(
      category,
      resourceName,
      providers[i],
      filteredResources,
    );
    providerPromises.push(providerModule.pushResources(context, resourceDefiniton));
  }

  await Promise.all(providerPromises);
}

module.exports = {
  pushResources,
};
