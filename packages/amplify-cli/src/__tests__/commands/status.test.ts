import { stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import { showApiAuthAcm } from '@aws-amplify/amplify-category-api';

jest.mock('@aws-amplify/amplify-category-hosting');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-category-api', () => ({
  showApiAuthAcm: jest.fn(async () => ''),
}));

const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
pathManagerMock.getBackendDirPath.mockReturnValue('testBackendDirPath');

const testApiName = 'testApiName';
const mockGraphQLAPIMeta = {
  providers: {
    awscloudformation: {
      Region: 'myMockRegion',
    },
  },
  api: {
    [testApiName]: {
      service: 'AppSync',
    },
  },
};

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
stateManagerMock.getMeta = jest.fn().mockImplementation(() => mockGraphQLAPIMeta);

const showApiAuthAcmMock = showApiAuthAcm as jest.MockedFunction<typeof showApiAuthAcm>;

describe('amplify status:', () => {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { run } = require('../../commands/status');
  const runStatusCmd = run;
  const statusPluginInfo = `${process.cwd()}/../amplify-console-hosting`;
  const mockPath = './help';

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('status run method should exist', () => {
    expect(runStatusCmd).toBeDefined();
  });

  it('status run method should call context.amplify.showStatusTable', async () => {
    const mockContextNoCLArgs = {
      amplify: {
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: mockPath }),
        pathManager: pathManagerMock,
      },
      parameters: {
        input: {
          command: 'status',
          subCommands: [],
          options: {
            verbose: true,
          },
        },
      },
    };
    runStatusCmd(mockContextNoCLArgs);
    expect(mockContextNoCLArgs.amplify.showStatusTable).toBeCalled();
  });

  it('status -v run method should call context.amplify.showStatusTable', async () => {
    const mockContextWithVerboseOptionAndCLArgs = {
      amplify: {
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: statusPluginInfo }),
        pathManager: pathManagerMock,
      },
      input: {
        command: 'status',
        options: {
          verbose: true,
        },
      },
    };
    runStatusCmd(mockContextWithVerboseOptionAndCLArgs);
    expect(mockContextWithVerboseOptionAndCLArgs.amplify.showStatusTable).toBeCalled();
  });

  it('status -v <category>* run method should call context.amplify.showStatusTable', async () => {
    const mockContextWithVerboseOptionWithCategoriesAndCLArgs = {
      amplify: {
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: statusPluginInfo }),
        pathManager: pathManagerMock,
      },
      input: {
        command: 'status',
        options: {
          verbose: true,
          api: true,
          storage: true,
        },
      },
    };

    runStatusCmd(mockContextWithVerboseOptionWithCategoriesAndCLArgs);
    expect(mockContextWithVerboseOptionWithCategoriesAndCLArgs.amplify.showStatusTable).toBeCalled();
  });

  it('status help run method should call ViewResourceTableParams.getStyledHelp', async () => {
    const mockContextWithHelpSubcommandAndCLArgs = {
      amplify: {
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: statusPluginInfo }),
        pathManager: pathManagerMock,
      },
      input: {
        command: 'status',
        subCommands: ['help'],
      },
    };
    runStatusCmd(mockContextWithHelpSubcommandAndCLArgs);
    expect(mockContextWithHelpSubcommandAndCLArgs.amplify.showStatusTable.mock.calls.length).toBe(0);
  });

  it('status api -acm Table run method should call showApiAuthAcm', async () => {
    const mockContextWithVerboseOptionAndCLArgs = {
      amplify: {
        getProviderPlugins: jest.fn().mockReturnValue({ awscloudformation: '../../__mocks__/faked-plugin' }),
        showStatusTable: jest.fn(),
        showGlobalSandboxModeWarning: jest.fn(),
        showHelpfulProviderLinks: jest.fn(),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: statusPluginInfo }),
        pathManager: pathManagerMock,
      },
      input: {
        command: 'status',
        options: {
          verbose: true,
          api: true,
          acm: 'Team',
        },
      },
    };

    jest.mock('../../../__mocks__/faked-plugin', () => ({
      compileSchema: jest.fn().mockReturnValue(Promise.resolve({})),
    }));

    await runStatusCmd(mockContextWithVerboseOptionAndCLArgs);
    expect(showApiAuthAcmMock.mock.calls.length).toBeGreaterThan(0);
  });
});
