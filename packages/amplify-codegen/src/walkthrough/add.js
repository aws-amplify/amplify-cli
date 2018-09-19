const { join } = require('path');
const askCodeGenTargetLanguage = require('./questions/languageTarget');
const askCodeGenQueryFilePattern = require('./questions/queryFilePattern');
const askTargetFileName = require('./questions/generatedFileName');
const askShouldGenerateCode = require('./questions/generateCode');
const askShouldGenerateDocs = require('./questions/generateDocs');

const {
  getFrontEndHandler,
  getSchemaDownloadLocation,
  getIncludePattern,
  getGraphQLDocPath,
} = require('../utils');

const DEFAULT_EXCLUDE_PATTERNS = ['./amplify/**'];

async function addWalkThrough(context, skip = []) {
  const frontendHandler = getFrontEndHandler(context);
  const schemaLocation = getSchemaDownloadLocation(context);
  const includePatternDefault = getIncludePattern(frontendHandler, schemaLocation);
  const answers = {
    excludePattern: DEFAULT_EXCLUDE_PATTERNS,
    schemaLocation,
  };

  const includePathGlob = join(
    includePatternDefault.graphQLDirectory,
    '**',
    includePatternDefault.graphQLExtension,
  );

  if (!skip.includes('includePattern')) {
    answers.includePattern = await askCodeGenQueryFilePattern([includePathGlob]);
  }
  if (frontendHandler !== 'android') {
    if (!skip.includes('targetLanguage')) {
      answers.target = await askCodeGenTargetLanguage(context);
    }
    if (!skip.includes('generatedFileName')) {
      answers.generatedFileName = await askTargetFileName('API', answers.target || '');
    }
    if (!skip.includes('shouldGenerateCode')) {
      answers.shouldGenerateCode = await askShouldGenerateCode();
    }
  }
  if (!skip.includes('shouldGenerateDocs')) {
    answers.shouldGenerateDocs = await askShouldGenerateDocs();
    answers.docsFilePath = getGraphQLDocPath(frontendHandler, schemaLocation);
  }

  return answers;
}
module.exports = addWalkThrough;
