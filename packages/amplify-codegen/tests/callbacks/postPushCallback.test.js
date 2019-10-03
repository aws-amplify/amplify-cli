const loadConfig = require('../../src/codegen-config');
const {
  downloadIntrospectionSchema,
  getAppSyncAPIDetails,
  getSchemaDownloadLocation,
} = require('../../src/utils');
const generateStatements = require('../../src/commands/statements');
const generateTypes = require('../../src/commands/types');
const postPushCallback = require('../../src/callbacks/postPushCallback');

const MOCK_CONTEXT = {
  print: {
    info: jest.fn(),
  },
};

jest.mock('../../src/codegen-config');
jest.mock('../../src/utils');
jest.mock('../../src/commands/statements');
jest.mock('../../src/commands/types');

const MOCK_PROJECT_NAME = 'MOCK_PROJECT';
const MOCK_API_ID = 'MOCK_API_ID';
const MOCK_API_ENDPOINT = 'MOCK_API_ENDPOINT';

const MOCK_SELECTED_PROJECT = {
  projectName: MOCK_PROJECT_NAME,
  id: MOCK_API_ID,
  endpoint: MOCK_API_ENDPOINT,
};
const MOCK_PROJECTS = [MOCK_SELECTED_PROJECT];
const MOCK_SCHEMA_DOWNLOAD_LOCATION = 'MOCK_SCHEMA_DOWNLOAD_MOCK_SCHEMA_DOWNLOAD_LOCATION';
const MOCK_GRAPHQL_CONFIG = {
  gqlConfig: {
    amplifyExtension: {},
    projectName: MOCK_PROJECT_NAME,
  },
  shouldGenerateDocs: true,
};

const LOAD_CONFIG_METHODS = {
  addProject: jest.fn(),
  save: jest.fn(),
};

describe('Callback - Post Push update AppSync API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    loadConfig.mockReturnValue(LOAD_CONFIG_METHODS);
    getAppSyncAPIDetails.mockReturnValue(MOCK_PROJECTS);
    getSchemaDownloadLocation.mockReturnValue(MOCK_SCHEMA_DOWNLOAD_LOCATION);
  });

  it('should update project configuration and generate code', async () => {
    await postPushCallback(MOCK_CONTEXT, { ...MOCK_GRAPHQL_CONFIG });
    expect(loadConfig).toHaveBeenCalledWith(MOCK_CONTEXT);
    expect(getAppSyncAPIDetails).toHaveBeenCalledWith(MOCK_CONTEXT);
    expect(getSchemaDownloadLocation).toHaveBeenCalledWith(MOCK_CONTEXT);
    expect(downloadIntrospectionSchema).toHaveBeenCalledWith(
      MOCK_CONTEXT,
      MOCK_API_ID,
      MOCK_SCHEMA_DOWNLOAD_LOCATION,
    );
    expect(LOAD_CONFIG_METHODS.addProject).toHaveBeenCalled();
    const newProject = LOAD_CONFIG_METHODS.addProject.mock.calls[0][0];
    expect(newProject).toEqual({
      ...MOCK_GRAPHQL_CONFIG.gqlConfig,
      amplifyExtension: {
        ...MOCK_GRAPHQL_CONFIG.gqlConfig.amplifyExtension,
      },
      schema: MOCK_SCHEMA_DOWNLOAD_LOCATION,
    });
    expect(generateTypes).toHaveBeenCalledTimes(1);
    expect(generateStatements).toHaveBeenCalledTimes(1);
  });

  it('should not update schema location when updating existing API', async () => {
    const PREV_DOWNLOAD_LOCATION = 'src/graphql/schema.json';
    await postPushCallback(MOCK_CONTEXT, {
      gqlConfig: {
        ...MOCK_GRAPHQL_CONFIG.gqlConfig,
        schema: PREV_DOWNLOAD_LOCATION,
      },
    });
    expect(loadConfig).not.toHaveBeenCalledWith();
    expect(getAppSyncAPIDetails).toHaveBeenCalledWith(MOCK_CONTEXT);
    expect(getSchemaDownloadLocation).not.toHaveBeenCalled();
    expect(downloadIntrospectionSchema).toHaveBeenCalledWith(
      MOCK_CONTEXT,
      MOCK_API_ID,
      PREV_DOWNLOAD_LOCATION,
    );
    expect(LOAD_CONFIG_METHODS.addProject).not.toHaveBeenCalled();
  });

  it('should not save codegen config when graphQLConfig is missing', async () => {
    await postPushCallback(MOCK_CONTEXT, null);
    expect(loadConfig).not.toHaveBeenCalled();
    expect(getAppSyncAPIDetails).not.toHaveBeenCalled();
    expect(getSchemaDownloadLocation).not.toHaveBeenCalled();
    expect(downloadIntrospectionSchema).not.toHaveBeenCalled();
    expect(LOAD_CONFIG_METHODS.addProject).not.toHaveBeenCalled();
    expect(generateTypes).not.toBeCalled();
    expect(generateStatements).not.toBeCalled();
  });
});
