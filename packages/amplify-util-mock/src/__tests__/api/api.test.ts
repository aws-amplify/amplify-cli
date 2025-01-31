import * as fs from 'fs-extra';
import * as path from 'path';
import { $TSContext, AmplifyError, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import { APITest } from '../../api/api';
import * as lambdaInvoke from '../../api/lambda-invoke';
import { getMockSearchableTriggerDirectory } from '../../utils';
import { ConfigOverrideManager } from '../../utils/config-override';
import { run } from '../../commands/mock/api';
import { start } from '../../api';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as Record<string, unknown>),
  pathManager: {
    getAmplifyMetaFilePath: jest.fn(),
    getAWSCredentialsFilePath: jest.fn(),
    getAWSConfigFilePath: jest.fn(),
  },
  FeatureFlags: {
    getNumber: jest.fn(),
  },
  stateManager: {
    getLocalEnvInfo: jest.fn(),
    localEnvInfoExists: jest.fn(),
  },
}));
jest.mock('amplify-dynamodb-simulator', () => jest.fn());
jest.mock('fs-extra');

const mockProjectRoot = 'mock-app';

describe('Test Mock API methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pathManager.getAmplifyPackageLibDirPath = jest.fn().mockReturnValue('backend');
  });

  it('attempts to copy searchable lambda trigger artifacts correctly', async () => {
    const mockContext = {
      amplify: {
        getEnvInfo: jest.fn().mockReturnValue({ projectPath: mockProjectRoot }),
        loadRuntimePlugin: jest.fn().mockReturnValue({}),
      },
    } as unknown as $TSContext;
    const searchableLambdaResourceDir = path.resolve(__dirname, '..', '..', '..', 'resources', 'mock-searchable-lambda-trigger');
    const mockSearchableTriggerDirectory = getMockSearchableTriggerDirectory(mockContext);

    const testApi = new APITest();
    const testApiProto = Object.getPrototypeOf(testApi);
    jest.spyOn(lambdaInvoke, 'buildLambdaTrigger').mockResolvedValueOnce();
    await testApiProto.createMockSearchableArtifacts(mockContext);

    expect(fs.copySync).toBeCalledTimes(2);

    // copies the pipfile artifact from correct location
    expect(fs.copySync).toBeCalledWith(
      path.join(searchableLambdaResourceDir, 'Pipfile'),
      path.join(mockSearchableTriggerDirectory, 'Pipfile'),
      { overwrite: true },
    );

    // copies the source files artifacts from correct location
    expect(fs.copySync).toBeCalledWith(
      path.join(searchableLambdaResourceDir, 'source-files'),
      path.join(mockSearchableTriggerDirectory, 'src'),
      { overwrite: true },
    );
  });

  it('Shows the error message, resolution & link to docs when no appsync api exist', async () => {
    ConfigOverrideManager.getInstance = jest.fn().mockReturnValue(jest.fn);
    const mockContext = {
      print: {
        red: jest.fn(),
        green: jest.fn(),
        error: jest.fn(),
      },
      amplify: {
        addCleanUpTask: jest.fn,
        pathManager: {
          getAmplifyMetaFilePath: jest.fn(),
        },
        readJsonFile: jest.fn().mockReturnValue({ api: {} }),
      },
    } as unknown as $TSContext;

    const testApi = new APITest();
    await testApi.start(mockContext);

    await expect(testApi['getAppSyncAPI'](mockContext)).rejects.toThrow(
      new AmplifyError('MockProcessError', {
        message: 'No AppSync API is added to the project',
        resolution: `Use 'amplify add api' in the root of your app directory to create a GraphQL API.`,
        link: 'https://docs.amplify.aws/cli/graphql/troubleshooting/',
      }),
    );
    expect(mockContext.print.green).toHaveBeenCalledWith(
      '\n For troubleshooting the GraphQL API, visit https://docs.amplify.aws/cli/graphql/troubleshooting/ ',
    );
  });

  it('shows error message & resolution when amplify environment is not initialized', async () => {
    ConfigOverrideManager.getInstance = jest.fn().mockReturnValue(jest.fn);
    const mockContext = {
      print: {
        red: jest.fn(),
        green: jest.fn(),
        error: jest.fn(),
      },
      parameters: {
        options: {
          help: false,
        },
      },
      amplify: {
        getEnvInfo: jest.fn(() => {
          throw new AmplifyError('EnvironmentNotInitializedError', {
            message: 'Current environment cannot be determined.',
            resolution: `Use 'amplify init' in the root of your app directory to create a new environment.`,
          });
        }),
        loadRuntimePlugin: jest.fn().mockReturnValue({}),
        addCleanUpTask: jest.fn,
        pathManager: {
          getAmplifyMetaFilePath: jest.fn(),
          getGitIgnoreFilePath: jest.fn(),
        },
        stateManager: {
          localEnvInfoExists: false,
        },
        readJsonFile: jest.fn().mockReturnValue({ api: {} }),
        getProjectDetails: {},
      },
    } as unknown as $TSContext;
    await run(mockContext);
    await expect(mockContext.print.error).toHaveBeenCalledWith('Failed to start API Mocking.');
  });

  it('shows error message and resolution when https enabled if SSL key and certificate paths are not provided', async () => {
    ConfigOverrideManager.getInstance = jest.fn().mockReturnValue(jest.fn);
    const mockContext = {
      print: {
        red: jest.fn(),
        green: jest.fn(),
        error: jest.fn(),
      },
      parameters: {
        options: {
          help: false,
        },
      },
      input: {
        argv: ['--https'],
      },
      amplify: {
        getEnvInfo: jest.fn().mockReturnValue({ projectPath: mockProjectRoot }),
        pathManager: {
          getGitIgnoreFilePath: jest.fn(),
        },
      },
    } as unknown as $TSContext;
    await run(mockContext);
    await expect(mockContext.print.error).toHaveBeenCalledWith(
      '\nThe --https option must be followed by the path to the SSL key and the path to the SSL certificate.\n',
    );
  });

  it('attempts to set custom port correctly', async () => {
    const GRAPHQL_PORT = 8081;
    const mockContext = {
      amplify: {
        getEnvInfo: jest.fn().mockReturnValue({ projectPath: mockProjectRoot }),
        pathManager: {
          getGitIgnoreFilePath: jest.fn(),
        },
      },
    } as unknown as $TSContext;
    const startMock = jest.spyOn(APITest.prototype, 'start').mockResolvedValueOnce();
    jest.spyOn(JSONUtilities, 'readJson').mockReturnValue({ graphqlPort: GRAPHQL_PORT });
    await start(mockContext);
    expect(startMock.mock.calls[0][1]).toBe(GRAPHQL_PORT);
  });
});
