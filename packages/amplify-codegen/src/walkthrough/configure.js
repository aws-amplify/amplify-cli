const askForGraphQLAPIResource = require('./questions/selectProject');
const askCodeGenTargetLanguage = require('./questions/languageTarget');
const askCodeGeneQueryFilePattern = require('./questions/queryFilePattern');
const askTargetFileName = require('./questions/generatedFileName');
const { getFrontEndHandler } = require('../utils/');

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
async function configureProjectWalkThrough(context, amplifyConfig) {
  const frontendHandler = getFrontEndHandler(context);
  const projects = amplifyConfig.map(cfg => ({
    name: cfg.projectName,
    value: cfg.amplifyExtension.graphQLApiId,
  }));
  const apiId = await askForGraphQLAPIResource(context, projects);

  const selectedProjectConfig = deepCopy(
    amplifyConfig.find(project => project.amplifyExtension.graphQLApiId === apiId),
  );

  const { amplifyExtension } = selectedProjectConfig;
  selectedProjectConfig.includes = await askCodeGeneQueryFilePattern(
    selectedProjectConfig.includes,
  );
  if (frontendHandler !== 'android') {
    amplifyExtension.codeGenTarget = await askCodeGenTargetLanguage(
      context,
      amplifyExtension.codeGenTarget,
    );

    amplifyExtension.generatedFileName = await askTargetFileName(
      amplifyExtension.generatedFileName || 'API',
      amplifyExtension.codeGenTarget,
    );
  }

  return selectedProjectConfig;
}
module.exports = configureProjectWalkThrough;
