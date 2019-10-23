const askCodegenTargetLanguage = require('../../src/walkthrough/questions/languageTarget');
const askCodegneQueryFilePattern = require('../../src/walkthrough/questions/queryFilePattern');
const askGeneratedFileName = require('../../src/walkthrough/questions/generatedFileName');
const askGenerateCode = require('../../src/walkthrough/questions/generateCode');
const askShouldGenerateDocs = require('../../src/walkthrough/questions/generateDocs');
const askMaxDepth = require('../../src/walkthrough/questions/maxDepth');
const { getGraphQLDocPath, getSchemaDownloadLocation, getFrontEndHandler, getIncludePattern } = require('../../src/utils');
const add = require('../../src/walkthrough/add');

jest.mock('../../src/walkthrough/questions/languageTarget');
jest.mock('../../src/walkthrough/questions/queryFilePattern');
jest.mock('../../src/walkthrough/questions/generatedFileName');
jest.mock('../../src/utils');
jest.mock('../../src/walkthrough/questions/generateCode');
jest.mock('../../src/walkthrough/questions/generateDocs');
jest.mock('../../src/walkthrough/questions/maxDepth');

describe('Add walk-through', () => {
  const MOCK_TARGET_LANGUAGE = 'MOCK_TARGET_LANGUAGE';
  const MOCK_INCLUDE_PATTERN = 'MOCK_INCLUDE_PATTERN';
  const MOCK_CONTEXT = {
    exeInfo: {},
  };
  const MOCK_GENERATED_FILE_NAME = 'MOCK_FILE_NAME.ts';
  const MOCK_DOWNLOAD_LOCATION = 'MOCK_SCHEMA_DIR/graphql/schema.json';
  const MOCK_DOCS_FILE_PATH = 'mockDocFilesPath';
  const MOCK_FRONTEND_HANDLER = 'mockFrontEndHandler';
  const MOCK_MAX_DEPTH = 20;

  beforeEach(() => {
    jest.clearAllMocks();
    askCodegenTargetLanguage.mockReturnValue(MOCK_TARGET_LANGUAGE);
    askGeneratedFileName.mockReturnValue(MOCK_GENERATED_FILE_NAME);
    askGenerateCode.mockReturnValue(true);
    askShouldGenerateDocs.mockReturnValue(true);
    getSchemaDownloadLocation.mockReturnValue(MOCK_DOWNLOAD_LOCATION);
    askCodegneQueryFilePattern.mockReturnValue(MOCK_INCLUDE_PATTERN);
    getFrontEndHandler.mockReturnValue(MOCK_FRONTEND_HANDLER);
    getGraphQLDocPath.mockReturnValue(MOCK_DOCS_FILE_PATH);
    getIncludePattern.mockReturnValue({
      graphQLDirectory: 'src/graphql',
      graphQLExtension: '*.js',
    });
    askMaxDepth.mockReturnValue(MOCK_MAX_DEPTH);
  });

  it('should show questions in walkthrough', async () => {
    const results = await add(MOCK_CONTEXT);
    expect(askCodegenTargetLanguage).toHaveBeenCalledWith(MOCK_CONTEXT, undefined, undefined, undefined, undefined);
    expect(askCodegneQueryFilePattern).toHaveBeenCalledWith(['src/graphql/**/*.js']);
    expect(askGeneratedFileName).toHaveBeenCalledWith('API', MOCK_TARGET_LANGUAGE);
    expect(getGraphQLDocPath).toHaveBeenCalledWith(MOCK_FRONTEND_HANDLER, MOCK_DOWNLOAD_LOCATION);
    expect(results).toEqual({
      target: MOCK_TARGET_LANGUAGE,
      includePattern: MOCK_INCLUDE_PATTERN,
      excludePattern: ['./amplify/**'],
      generatedFileName: MOCK_GENERATED_FILE_NAME,
      shouldGenerateCode: true,
      schemaLocation: MOCK_DOWNLOAD_LOCATION,
      docsFilePath: MOCK_DOCS_FILE_PATH,
      shouldGenerateDocs: true,
      maxDepth: MOCK_MAX_DEPTH,
    });
  });

  it('should not ask code generation specific questions in android projects', async () => {
    getFrontEndHandler.mockReturnValue('android');
    const results = await add(MOCK_CONTEXT);
    expect(askCodegenTargetLanguage).not.toHaveBeenCalled();
    expect(askCodegneQueryFilePattern).toHaveBeenCalledWith(['src/graphql/**/*.js']);
    expect(askGeneratedFileName).not.toHaveBeenCalled();
    expect(results).toEqual({
      includePattern: MOCK_INCLUDE_PATTERN,
      excludePattern: ['./amplify/**'],
      schemaLocation: MOCK_DOWNLOAD_LOCATION,
      docsFilePath: MOCK_DOCS_FILE_PATH,
      shouldGenerateDocs: true,
      maxDepth: MOCK_MAX_DEPTH,
    });
  });

  it('should should skip includePattern when asked to skip', async () => {
    const skip = ['includePattern'];
    const results = await add(MOCK_CONTEXT, skip);
    expect(askCodegneQueryFilePattern).not.toHaveBeenCalled();
    expect(results).not.toHaveProperty('includePattern');
  });

  it('should should skip includePattern when asked to skip', async () => {
    const skip = ['targetLanguage'];
    const results = await add(MOCK_CONTEXT, skip);
    expect(askCodegenTargetLanguage).not.toHaveBeenCalled();
    expect(results).not.toHaveProperty('target');
  });

  it('should should skip generatedFileName when asked to skip', async () => {
    const skip = ['generatedFileName'];
    const results = await add(MOCK_CONTEXT, skip);
    expect(askGeneratedFileName).not.toHaveBeenCalled();
    expect(results).not.toHaveProperty('generatedFileName');
  });

  it('should should skip shouldGenerateCode when asked to skip', async () => {
    const skip = ['shouldGenerateCode'];
    const results = await add(MOCK_CONTEXT, skip);
    expect(askGenerateCode).not.toHaveBeenCalled();
    expect(results).not.toHaveProperty('shouldGenerateCode');
  });

  it('should should skip shouldGenerateDocs when asked to skip', async () => {
    const skip = ['shouldGenerateDocs'];
    const results = await add(MOCK_CONTEXT, skip);
    expect(askShouldGenerateDocs).not.toHaveBeenCalled();
    expect(results).not.toHaveProperty('shouldGenerateDocs');
    expect(results).not.toHaveProperty('docsFilePath');
  });
});
