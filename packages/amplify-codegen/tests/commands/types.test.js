const { sync } = require('glob-all');
const path = require('path');
const { generate } = require('amplify-graphql-types-generator');
const jetpack = require('fs-jetpack');

const loadConfig = require('../../src/codegen-config');
const generateTypes = require('../../src/commands/types');
const constants = require('../../src/constants');
const { downloadIntrospectionSchemaWithProgress, getFrontEndHandler } = require('../../src/utils');

const MOCK_CONTEXT = {
  print: {
    info: jest.fn(),
  },
};

jest.mock('glob-all');
jest.mock('amplify-graphql-types-generator');
jest.mock('../../src/codegen-config');
jest.mock('../../src/utils');
jest.mock('fs-jetpack');

const MOCK_INCLUDE_PATH = 'MOCK_INCLUDE';
const MOCK_EXCLUDE_PATH = 'MOCK_EXCLUDE';
const MOCK_QUERIES = ['q1.gql', 'q2.gql'];
const MOCK_SCHEMA = 'INTROSPECTION_SCHEMA.JSON';
const MOCK_TARGET = 'TYPE_SCRIPT_OR_FLOW_OR_ANY_OTHER_LANGUAGE';
const MOCK_GENERATED_FILE_NAME = 'API.TS';
const MOCK_API_ID = 'MOCK_API_ID';
const MOCK_REGION = 'MOCK_AWS_REGION';

const MOCK_PROJECT = {
  excludes: [MOCK_EXCLUDE_PATH],
  includes: [MOCK_INCLUDE_PATH],
  schema: MOCK_SCHEMA,
  amplifyExtension: {
    generatedFileName: MOCK_GENERATED_FILE_NAME,
    codeGenTarget: MOCK_TARGET,
    graphQLApiId: MOCK_API_ID,
    region: MOCK_REGION,
  },
};
sync.mockReturnValue(MOCK_QUERIES);

getFrontEndHandler.mockReturnValue('javascript');

describe('command - types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jetpack.exists.mockReturnValue(true);
    getFrontEndHandler.mockReturnValue('javascript');
    loadConfig.mockReturnValue({
      getProjects: jest.fn().mockReturnValue([MOCK_PROJECT]),
    });
  });
  it('should generate types', async () => {
    const forceDownload = false;
    await generateTypes(MOCK_CONTEXT, forceDownload);
    expect(getFrontEndHandler).toHaveBeenCalledWith(MOCK_CONTEXT);
    expect(loadConfig).toHaveBeenCalledWith(MOCK_CONTEXT);
    expect(sync).toHaveBeenCalledWith([MOCK_INCLUDE_PATH, `!${MOCK_EXCLUDE_PATH}`]);
    expect(jetpack.exists).toHaveBeenCalledWith(path.resolve(MOCK_SCHEMA));
    expect(generate).toHaveBeenCalledWith(
      MOCK_QUERIES,
      path.resolve(MOCK_SCHEMA),
      MOCK_GENERATED_FILE_NAME,
      '',
      MOCK_TARGET,
      '',
      { addTypename: true },
    );
  });

  it('should not generate type if the frontend is android', async () => {
    const forceDownload = false;
    getFrontEndHandler.mockReturnValue('android');
    await generateTypes(MOCK_CONTEXT, forceDownload);
    expect(generate).not.toHaveBeenCalled();
  });

  it('should download the schema if forceDownload flag is passed', async () => {
    const forceDownload = true;
    await generateTypes(MOCK_CONTEXT, forceDownload);
    expect(downloadIntrospectionSchemaWithProgress).toHaveBeenCalledWith(
      MOCK_CONTEXT,
      MOCK_API_ID,
      MOCK_SCHEMA,
      MOCK_REGION,
    );
  });

  it('should download the schema if the schema file is missing', async () => {
    jetpack.exists.mockReturnValue(false);
    const forceDownload = false;
    await generateTypes(MOCK_CONTEXT, forceDownload);
    expect(downloadIntrospectionSchemaWithProgress).toHaveBeenCalledWith(
      MOCK_CONTEXT,
      MOCK_API_ID,
      MOCK_SCHEMA,
      MOCK_REGION,
    );
  });

  it('should show a warning if there are no projects configured', async () => {
    loadConfig.mockReturnValue({
      getProjects: jest.fn().mockReturnValue([]),
    });
    await generateTypes(MOCK_CONTEXT, false);
    expect(MOCK_CONTEXT.print.info).toHaveBeenCalledWith(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
  });
});
