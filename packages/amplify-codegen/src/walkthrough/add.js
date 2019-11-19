const { join } = require('path');
const askCodeGenTargetLanguage = require('./questions/languageTarget');
const askCodeGenQueryFilePattern = require('./questions/queryFilePattern');
const askTargetFileName = require('./questions/generatedFileName');
const askShouldGenerateCode = require('./questions/generateCode');
const askShouldGenerateDocs = require('./questions/generateDocs');
const askMaxDepth = require('./questions/maxDepth');
const { normalizeInputParams } = require('../utils/input-params-manager');
const constants = require('../constants');
const { getOutputFileName } = require('../utils');

const { getFrontEndHandler, getSchemaDownloadLocation, getIncludePattern, getGraphQLDocPath } = require('../utils');

const DEFAULT_EXCLUDE_PATTERNS = ['./amplify/**'];

async function addWalkThrough(context, skip = [], withoutInit, decoupleFrontend, decoupleFramework) {
  let inputParams;
  let yesFlag = false;
  if (context.exeInfo && context.exeInfo.inputParams) {
    normalizeInputParams(context);
    inputParams = context.exeInfo.inputParams[constants.Label];
    yesFlag = context.exeInfo.inputParams.yes;
  }

  let frontend = decoupleFrontend;
  let schemaLocation = '';

  if (frontend === 'android') {
    schemaLocation = './app/src/main/graphql/schema.json';
  } else if (frontend === 'ios') {
    schemaLocation = './graphql/schema.json';
  } else if (frontend === 'javascript') {
    schemaLocation = './src/graphql/schema.json';
  } else {
    schemaLocation = './src/graphql/schema.json';
  }

  if (!withoutInit) {
    frontend = getFrontEndHandler(context);
    schemaLocation = getSchemaDownloadLocation(context);
  }
  const answers = {
    excludePattern: DEFAULT_EXCLUDE_PATTERNS,
    schemaLocation,
  };

  let targetLanguage = 'android';

  if (frontend !== 'android') {
    if (!skip.includes('targetLanguage')) {
      answers.target = await determineValue(inputParams, yesFlag, 'targetLanguage', 'javascript', () =>
        askCodeGenTargetLanguage(context, undefined, withoutInit, decoupleFrontend, decoupleFramework)
      );
      targetLanguage = answers.target;
    }
  }

  const includePatternDefault = getIncludePattern(targetLanguage, schemaLocation);
  const includePathGlob = join(includePatternDefault.graphQLDirectory, '**', includePatternDefault.graphQLExtension);

  if (!skip.includes('includePattern')) {
    answers.includePattern = await determineValue(inputParams, yesFlag, 'includePattern', [includePathGlob], () =>
      askCodeGenQueryFilePattern([includePathGlob])
    );
  }
  if (!skip.includes('shouldGenerateDocs')) {
    answers.shouldGenerateDocs = await determineValue(inputParams, yesFlag, 'generateDocs', true, () => askShouldGenerateDocs());
    answers.docsFilePath = getGraphQLDocPath(frontend, schemaLocation);
  }

  if (answers.shouldGenerateDocs && !skip.includes('maxDepth')) {
    answers.maxDepth = await determineValue(inputParams, yesFlag, 'maxDepth', true, askMaxDepth);
  }

  if (!(frontend === 'android' || answers.target === 'javascript')) {
    if (!skip.includes('generatedFileName')) {
      const defaultValue = getOutputFileName('API', answers.target || '');
      answers.generatedFileName = await determineValue(inputParams, yesFlag, 'generatedFileName', defaultValue, () =>
        askTargetFileName('API', answers.target || '')
      );
    }
    if (!skip.includes('shouldGenerateCode')) {
      answers.shouldGenerateCode = await determineValue(inputParams, yesFlag, 'generateCode', true, () => askShouldGenerateCode());
    }
  }

  return answers;
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

module.exports = addWalkThrough;
