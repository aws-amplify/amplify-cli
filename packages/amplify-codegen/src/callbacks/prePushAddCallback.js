const { normalizeInputParams } = require('../utils/input-params-manager');
const constants = require('../constants');
const askShouldGenerateCode = require('../walkthrough/questions/generateCode');
const addWalkThrough = require('../walkthrough/add');
const { isCodegenConfigured } = require('../utils');
const prePushUpdateCallback = require('./prePushUpdateCallback');

async function prePushAddCallback(context, resourceName) {
  // when codegen is already configured
  if (isCodegenConfigured(context, resourceName)) {
    return prePushUpdateCallback(context, resourceName);
  }

  let shouldGenerateCode = false;
  if (context.exeInfo.inputParams) {
    normalizeInputParams(context);
    const inputParams = context.exeInfo.inputParams[constants.Label];
    const yesFlag = context.exeInfo.inputParams.yes;

    shouldGenerateCode = await determineValue(inputParams, yesFlag, 'generateCode', true, () =>
      askShouldGenerateCode(),
    );
  } else {
    shouldGenerateCode = await askShouldGenerateCode();
  }

  if (shouldGenerateCode) {
    const answers = await addWalkThrough(context, ['shouldGenerateCode']);
    const newProject = {
      projectName: resourceName,
      includes: answers.includePattern,
      excludes: answers.excludePattern,
      amplifyExtension: {
        codeGenTarget: answers.target || '',
        generatedFileName: answers.generatedFileName || '',
        docsFilePath: answers.docsFilePath,
      },
    };
    return {
      gqlConfig: newProject,
      shouldGenerateDocs: answers.shouldGenerateDocs,
    };
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

module.exports = prePushAddCallback;
