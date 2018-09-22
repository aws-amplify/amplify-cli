const addWalkthrough = require('../../src/walkthrough/add');
const askShouldGenerateCode = require('../../src/walkthrough/questions/generateCode');

const prePushAddCallback = require('../../src/callbacks/prePushAddCallback');

const MOCK_CONTEXT = {
  print: {
    info: jest.fn(),
  },
};
jest.mock('../../src/walkthrough/add');
jest.mock('../../src/walkthrough/questions/generateCode');

const MOCK_RESOURCE_NAME = 'MOCK_API_NAME';
const MOCK_INCLUDE_PATTERN = 'MOCK_INCLUDE';
const MOCK_EXCLUDE_PATTERN = 'MOCK_EXCLUDE';
const MOCK_TARGET = 'TYPE_SCRIPT_OR_FLOW_OR_ANY_OTHER_LANGUAGE';
const MOCK_GENERATED_FILE_NAME = 'API.TS';
const MOCK_DOCS_FILE_PATH = 'MOCK_DOCS_FILE_PATH';
const SHOULD_GENERATE_DOC = 'YES';

const MOCK_ANSWERS = {
  includePattern: MOCK_INCLUDE_PATTERN,
  excludePattern: MOCK_EXCLUDE_PATTERN,
  target: MOCK_TARGET,
  generatedFileName: MOCK_GENERATED_FILE_NAME,
  docsFilePath: MOCK_DOCS_FILE_PATH,
  shouldGenerateDocs: SHOULD_GENERATE_DOC,
};

describe('callback - prePushAddCallback', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    addWalkthrough.mockReturnValue(MOCK_ANSWERS);
    askShouldGenerateCode.mockReturnValue(true);
  });

  it('should walkthrough add questions', async () => {
    const { gqlConfig, shouldGenerateDocs } = await prePushAddCallback(
      MOCK_CONTEXT,
      MOCK_RESOURCE_NAME,
    );

    expect(gqlConfig).toEqual({
      projectName: MOCK_RESOURCE_NAME,
      includes: MOCK_INCLUDE_PATTERN,
      excludes: MOCK_EXCLUDE_PATTERN,
      amplifyExtension: {
        codeGenTarget: MOCK_TARGET,
        generatedFileName: MOCK_GENERATED_FILE_NAME,
        docsFilePath: MOCK_DOCS_FILE_PATH,
      },
    });

    expect(shouldGenerateDocs).toBe(SHOULD_GENERATE_DOC);
  });

  it('should not ask any question if user declines codeGeneration', async () => {
    askShouldGenerateCode.mockReturnValue(false);
    const result = await prePushAddCallback(MOCK_CONTEXT, MOCK_RESOURCE_NAME);
    expect(result).toBeUndefined();
  });
});
