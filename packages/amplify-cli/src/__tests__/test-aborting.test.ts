import { Context } from '../domain/context';
import { CLIInput as CommandLineInput } from '../domain/command-input';

describe('test SIGINT with execute', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('case: run', async () => {
    const input = { argv: ['/usr/local/bin/node', '/usr/local/bin/amplify-dev', '-v'], options: { v: true } };
    const mockExit = jest.fn();

    jest.setMock('@aws-amplify/amplify-cli-core', {
      ...(jest.requireActual('@aws-amplify/amplify-cli-core') as Record<string, unknown>),
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
        teamProviderInfoExists: jest.fn().mockReturnValue(true),
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
    jest.setMock('@aws-amplify/amplify-cli-logger', {
      getAmplifyLogger: jest.fn().mockReturnValue({
        logInfo: jest.fn(),
      }),
      Redactor: jest.fn(),
    });

    const mockContext: Context = jest.createMockFromModule('../domain/context');
    mockContext.input = input as unknown as CommandLineInput;
    mockContext.print = {
      warning: jest.fn(),
    };

    mockContext.usageData = {
      emitError: jest.fn(),
      emitAbort: jest.fn(),
      emitSuccess: jest.fn(),
      init: jest.fn(),
      startCodePathTimer: jest.fn(),
      stopCodePathTimer: jest.fn(),
      setIsHeadless: jest.fn(),
      pushHeadlessFlow: jest.fn(),
      pushInteractiveFlow: jest.fn(),
      getFlowReport: jest.fn(),
      assignProjectIdentifier: jest.fn(),
      getUsageDataPayload: jest.fn(),
      calculatePushNormalizationFactor: jest.fn(),
      getSessionUuid: jest.fn(),
    };
    mockContext.projectHasMobileHubResources = false;

    mockContext.amplify = jest.createMockFromModule('../domain/amplify-toolkit');
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

    jest.mock('@aws-amplify/amplify-environment-parameters');

    const originalExitCode = process.exitCode;
    setTimeout(() => {
      process.emit('SIGINT', 'SIGINT');
      process.exitCode = 2;
    }, 10);

    // for some reason this test doesn't work when hoisting this require to a top level import
    // probably something to do with how the mocks are constructed
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    await require('../index').run(Date.now());
    expect(mockContext.usageData.emitAbort).toBeCalled();
    expect(mockContext.usageData.emitError).toHaveBeenCalledTimes(0);
    expect(mockContext.usageData.emitSuccess).toHaveBeenCalledTimes(0);
    expect(mockExit).toBeCalledWith(2);
    // Setting exitCode back to original, see https://github.com/jestjs/jest/issues/9324#issuecomment-1808090455
    process.exitCode = originalExitCode;
  }, 10000);
});

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
