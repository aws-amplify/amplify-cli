const { normalizeInputParams } = require('../utils/input-params-manager');
const constants = require('../constants');
const loadConfig = require('../codegen-config');
const askShouldUpdateCode = require('../walkthrough/questions/updateCode');
const askShouldUpdateDocs = require('../walkthrough/questions/updateDocs');
const path = require('path');
const { isDataStoreEnabled } = require('graphql-transformer-core');
const { pathManager } = require('amplify-cli-core');

async function prePushUpdateCallback(context, resourceName) {
  const config = loadConfig(context);
  const project = config.getProjects().find(projectItem => projectItem.projectName === resourceName);
  if (project) {
    let shouldGenerateCode = false;
    let shouldGenerateDocs = false;
    if (context.exeInfo.inputParams) {
      normalizeInputParams(context);
      const inputParams = context.exeInfo.inputParams[constants.Label];
      const yesFlag = context.exeInfo.inputParams.yes;

      shouldGenerateCode = await determineValue(inputParams, yesFlag, 'generateCode', true, () => askShouldUpdateCode());

      if (shouldGenerateCode) {
        shouldGenerateDocs = await determineValue(inputParams, yesFlag, 'generateDocs', true, () => askShouldUpdateDocs());
      }
    } else {
      shouldGenerateCode = await askShouldUpdateCode();
      if (shouldGenerateCode) {
        shouldGenerateDocs = await askShouldUpdateDocs();
      }
    }

    if (shouldGenerateCode) {
      return {
        shouldGenerateModels: await isDataStoreEnabled(path.join(pathManager.getBackendDirPath(), 'api', resourceName)),
        gqlConfig: project,
        shouldGenerateDocs,
      };
    }
  }
}

async function determineValue(inputParams, yesFlag, propertyName, defaultValue, askFunction) {
  let result;
  if (inputParams && inputParams.hasOwnProperty(propertyName)) {
    result = inputParams[propertyName];
  } else if (yesFlag && defaultValue !== undefined) {
    result = defaultValue;
  } else {
    result = await askFunction();
  }
  return result;
}

module.exports = prePushUpdateCallback;
