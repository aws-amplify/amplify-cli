import { Context } from '../domain/context';

describe('test SIGINT with execute', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('case: run', async () => {
    const input = { argv: ['/usr/local/bin/node', '/usr/local/bin/amplify-dev', '-v'], options: { v: true } };
    const mockExit = jest.fn();

    jest.setMock('amplify-cli-core', {
      ...(jest.requireActual('amplify-cli-core') as {}),
      JSONUtilities: {
        readJson: jest.fn().mockReturnValue({
          name: 'cli',
          version: '12.12.1',
        }),
        stringify: jest.fn().mockReturnValue(''),
      },
      exitOnNextTick: mockExit,
      pathManager: {
        getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('homedir/.amplify'),
        getAWSCredentialsFilePath: jest.fn(),
        getAWSConfigFilePath: jest.fn(),
        findProjectRoot: jest.fn(),
      },
      stateManager: {
        getMeta: jest.fn(),
        projectConfigExists: jest.fn(),
        localEnvInfoExists: jest.fn().mockReturnValue(true),
      },
      FeatureFlags: {
        initialize: jest.fn(),
      },
      BannerMessage: {
        initialize: jest.fn(),
        getMessage: jest.fn(),
      },
      PathConstants: {
        TeamProviderFileName: 'team-provider-info.json',
        DeploymentSecretsFileName: 'deployment-secrets.json',
      },
      CLIContextEnvironmentProvider: jest.fn(),
      executeHooks: jest.fn(),
      HooksMeta: {
        getInstance: jest.fn().mockReturnValue({
          setAmplifyVersion: jest.fn(),
          setHookEventFromInput: jest.fn(),
        }),
      },
      skipHooks: jest.fn(),
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
    jest.setMock('amplify-cli-logger', {
      logger: {
        logInfo: jest.fn(),
      },
      Redactor: jest.fn(),
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
    Object.defineProperty(mockContext.amplify, 'getEnvInfo', { value: jest.fn() });
    jest.setMock('../context-manager', {
      constructContext: jest.fn().mockReturnValue(mockContext),
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
    }, 10);

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
