const loadConfig = require('../../src/codegen-config');
const generateStatements = require('../../src/commands/statements');
const generateTypes = require('../../src/commands/types');
const generateStatementsAndTypes = require('../../src/commands/generateStatementsAndType');
const { AmplifyCodeGenNoAppSyncAPIAvailableError } = require('../../src/errors');
const path = require('path');

const {
  ensureIntrospectionSchema,
  getAppSyncAPIDetails,
} = require('../../src/utils');

const MOCK_CONTEXT = {
  print: {
    info: jest.fn(),
  },
  amplify: {
    getEnvInfo: jest.fn(),
  },
};

jest.mock('../../src/commands/types');
jest.mock('../../src/commands/statements');
jest.mock('../../src/codegen-config');
jest.mock('../../src/utils');

const MOCK_INCLUDE_PATH = 'MOCK_INCLUDE';
const MOCK_STATEMENTS_PATH = 'MOCK_STATEMENTS_PATH';
const MOCK_SCHEMA = 'INTROSPECTION_SCHEMA.JSON';
const MOCK_TARGET = 'TYPE_SCRIPT_OR_FLOW_OR_ANY_OTHER_LANGUAGE';
const MOCK_GENERATED_FILE_NAME = 'API.TS';
const MOCK_API_ID = 'MOCK_API_ID';
const MOCK_REGION = 'MOCK_AWS_REGION';
const MOCK_PROJECT_ROOT = 'MOCK_PROJECT_ROOT';

const MOCK_PROJECT = {
  includes: [MOCK_INCLUDE_PATH],
  schema: MOCK_SCHEMA,
  amplifyExtension: {
    generatedFileName: MOCK_GENERATED_FILE_NAME,
    codeGenTarget: MOCK_TARGET,
    docsFilePath: MOCK_STATEMENTS_PATH,
    region: MOCK_REGION,
  },
};
const MOCK_APIS = [
  {
    id: MOCK_API_ID,
  },
];

describe('command - generateStatementsAndTypes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    loadConfig.mockReturnValue({
      getProjects: jest.fn().mockReturnValue([MOCK_PROJECT]),
    });
    MOCK_CONTEXT.amplify.getEnvInfo.mockReturnValue({ projectPath: MOCK_PROJECT_ROOT });
    getAppSyncAPIDetails.mockReturnValue(MOCK_APIS);
  });

  it('should generate statements and types', async () => {
    const forceDownload = false;
    await generateStatementsAndTypes(MOCK_CONTEXT, forceDownload);
    expect(loadConfig).toHaveBeenCalledWith(MOCK_CONTEXT);
    expect(generateStatements).toHaveBeenCalledWith(MOCK_CONTEXT, false, undefined);
    expect(generateTypes).toHaveBeenCalledWith(MOCK_CONTEXT, false);
  });

  it('should download the schema if forceDownload flag is passed', async () => {
    const forceDownload = true;
    await generateStatementsAndTypes(MOCK_CONTEXT, forceDownload);
    expect(ensureIntrospectionSchema).toHaveBeenCalledWith(
      MOCK_CONTEXT,
      path.join(MOCK_PROJECT_ROOT, MOCK_SCHEMA),
      MOCK_APIS[0],
      MOCK_REGION,
      forceDownload,
    );
  });

  it('should show a warning if there are no projects configured', async () => {
    loadConfig.mockReturnValue({
      getProjects: jest.fn().mockReturnValue([]),
    });
    await expect(generateStatementsAndTypes(MOCK_CONTEXT, false)).rejects.toBeInstanceOf(
      AmplifyCodeGenNoAppSyncAPIAvailableError,
    );
  });
});
