import { Context } from '../domain/context';

describe('test SIGINT with execute', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });
  it('case: run', async () => {
    const input = { argv: ['/usr/local/bin/node', '/usr/local/bin/amplify-dev', '-v'], options: { v: true } };
    const mockExit = jest.fn();

    jest.setMock('amplify-cli-core', {
      JSONUtilities: {
        readJson: jest.fn().mockReturnValue({
          name: 'cli',
          version: '12.12.1',
        }),
        stringify: jest.fn().mockReturnValue(''),
      },
      exitOnNextTick: mockExit,
      pathManager: {
        getAWSCredentialsFilePath: jest.fn(),
        getAWSConfigFilePath: jest.fn(),
        findProjectRoot: jest.fn(),
      },
      stateManager: {
        getMeta: jest.fn(),
        projectConfigExists: jest.fn(),
      },
      FeatureFlags: {
        initialize: jest.fn(),
      },
      CLIContextEnvironmentProvider: jest.fn(),
    });
    jest.setMock('../plugin-manager', {
      getPluginPlatform: jest.fn(),
    });
    jest.setMock('../input-manager', {
      getCommandLineInput: jest.fn().mockReturnValue(input),
      verifyInput: jest.fn().mockReturnValue({
        verified: true,
      }),
    });

    const mockContext: Context = jest.genMockFromModule('../domain/context');
    mockContext.input = input;
    mockContext.print = {
      warning: jest.fn(),
    };
    mockContext.usageData = {
      emitError: jest.fn(),
      emitAbort: jest.fn(),
      emitInvoke: jest.fn(),
      emitSuccess: jest.fn(),
      init: jest.fn(),
    };
    mockContext.projectHasMobileHubResources = false;
    mockContext.amplify = jest.genMockFromModule('../domain/amplify-toolkit');
    jest.setMock('../context-manager', {
      constructContext: jest.fn().mockReturnValue(mockContext),
      persistContext: jest.fn(),
      attachUsageData: jest.fn(),
    });

    jest.setMock('../project-config-version-check', {
      checkProjectConfigVersion: jest.fn(),
    });
    jest.setMock('../execution-manager', {
      executeCommand: async () => {
        await sleep(2000);
      },
    });

    setTimeout(() => {
      process.emit('SIGINT', 'SIGINT');
      process.exitCode = 2;
    }, 50);

    await require('../index').run();
    expect(mockContext.usageData.emitAbort).toBeCalled();
    expect(mockContext.usageData.emitInvoke).toBeCalled();
    expect(mockContext.usageData.emitError).toHaveBeenCalledTimes(0);
    expect(mockContext.usageData.emitSuccess).toHaveBeenCalledTimes(0);
    expect(mockExit).toBeCalledWith(2);
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
