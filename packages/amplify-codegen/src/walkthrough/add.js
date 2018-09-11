const { join } = require('path');
const askAppSyncAPITarget = require('./questions/apiTarget');
const askCodeGenTargetLanguage = require('./questions/languageTarget');
const askCodeGenQueryFilePattern = require('./questions/queryFilePattern');
const askTargetFileName = require('./questions/generatedFileName');
const askShouldGenerateCode = require('./questions/generateCode');
const askShouldGenerateDocs = require('./questions/generateDocs');

const {
  getAppSyncAPIDetails,
  getFrontEndHandler,
  getSchemaDownloadLocation,
  getIncludePattern,
} = require('../utils/');
const {
  AmplifyCodeGenNoAppSyncAPIAvailableError: NoAppSyncAPIAvailableError,
} = require('../errors');
const constants = require('../constants');

const DEFAULT_EXCLUDE_PATTERNS = ['./amplify/**'];

async function addWalkThrough(context, configs) {
  const availableAppSyncApis = getAppSyncAPIDetails(context); // published and up published
  const alreadyAddedApis = configs.map(cfg => cfg.amplifyExtension.graphQLApiId);
  const newAPIs = availableAppSyncApis.filter(api => api.id && !alreadyAddedApis.includes(api.id));
  const unpublishedApis = availableAppSyncApis.filter(api => !api.id);

  // No API GraphQL API is added to the project
  if (availableAppSyncApis.length === 0) {
    throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_NO_API_AVAILABLE);
  }

  // GraphQL API is added but not pushed to cloud
  if (newAPIs.length === 0 && unpublishedApis.length > 0) {
    throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_PENDING_API_PUSH);
  }

  // All GraphQL APIs are already configured
  if (newAPIs.length === 0) {
    throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_ALL_APIS_ALREADY_ADDED);
  }

  // Some APIs are pending push
  if (unpublishedApis.length) {
    context.print.info(constants.WARNING_CODEGEN_PENDING_API_PUSH);
    context.print.info(unpublishedApis.map(api => api.name).join('\n'));
  }
  let targetLanguage = '';
  let includePattern = '';
  let generatedFileName = '';
  let shouldGenerateCode = false;

  const apiId = await askAppSyncAPITarget(context, newAPIs, null);
  const api = newAPIs.find(a => a.id === apiId);
  const frontendHandler = getFrontEndHandler(context);
  const schemaLocation = getSchemaDownloadLocation(context, api.name);
  const includePatternDefault = getIncludePattern(frontendHandler, schemaLocation);
  const includePathGlob = join(
    includePatternDefault.graphQLDirectory,
    '**',
    includePatternDefault.graphQLExtension,
  );
  includePattern = await askCodeGenQueryFilePattern([includePathGlob]);

  if (frontendHandler !== 'android') {
    targetLanguage = await askCodeGenTargetLanguage(context);
    generatedFileName = await askTargetFileName('API', targetLanguage);
    shouldGenerateCode = await askShouldGenerateCode();
  }
  const shouldGenerateDocs = await askShouldGenerateDocs();

  return {
    api,
    target: targetLanguage,
    includePattern,
    excludePattern: DEFAULT_EXCLUDE_PATTERNS,
    generatedFileName,
    shouldGenerateCode,
    schemaLocation,
    shouldGenerateDocs,
    docsFilePath: includePatternDefault.graphQLDirectory,
  };
}
module.exports = addWalkThrough;
