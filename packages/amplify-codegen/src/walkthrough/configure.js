const { join } = require('path');

const askForGraphQLAPIResource = require('./questions/selectProject');
const askCodeGenTargetLanguage = require('./questions/languageTarget');
const askCodeGeneQueryFilePattern = require('./questions/queryFilePattern');
const askTargetFileName = require('./questions/generatedFileName');
const askMaxDepth = require('./questions/maxDepth');
const askForFrontend = require('./questions/selectFrontend');

const frontends = ['android', 'ios', 'javascript'];
const { getFrontEndHandler, getIncludePattern } = require('../utils/');

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
async function configureProjectWalkThrough(context, amplifyConfig) {
  let frontend;
  if (!context.withoutInit) {
    frontend = getFrontEndHandler(context);
  } else {
    frontend = await askForFrontend(frontends);
  }
  context.frontend = frontend;
  const projects = amplifyConfig.map(cfg => ({
    name: cfg.projectName,
    value: cfg.amplifyExtension.graphQLApiId,
  }));
  let apiId;
  if (!context.withoutInit) {
    apiId = await askForGraphQLAPIResource(context, projects);
  }

  let selectedProjectConfig;
  if (!context.withoutInit) {
    selectedProjectConfig = deepCopy(
        amplifyConfig.find(project => project.amplifyExtension.graphQLApiId === apiId),
      );
  } else {
    selectedProjectConfig = deepCopy(
      amplifyConfig.find(project => project.projectName === "Codegen Project"),
    );
  }

  const { amplifyExtension } = selectedProjectConfig;
  let targetLanguage = 'android';

  if (frontend !== 'android') {
    targetLanguage = await askCodeGenTargetLanguage(
      context,
      amplifyExtension.codeGenTarget,
    );
  }

  const includePatternDefault = getIncludePattern(targetLanguage, selectedProjectConfig.schema);
  const includePathGlob = join(
    includePatternDefault.graphQLDirectory,
    '**',
    includePatternDefault.graphQLExtension,
  );
  const includePattern =
    targetLanguage === amplifyExtension.codeGenTarget
      ? selectedProjectConfig.includes
      : [includePathGlob];

  selectedProjectConfig.includes = await askCodeGeneQueryFilePattern(includePattern);

  if (!(frontend === 'android' || targetLanguage === 'javascript')) {
    amplifyExtension.generatedFileName = await askTargetFileName(
      amplifyExtension.generatedFileName || 'API',
      targetLanguage,
    );
  } else {
    amplifyExtension.generatedFileName = '';
  }
  amplifyExtension.codeGenTarget = targetLanguage;

  amplifyExtension.maxDepth = await askMaxDepth(
    amplifyExtension.maxDepth,
  );

  return selectedProjectConfig;
}
module.exports = configureProjectWalkThrough;
