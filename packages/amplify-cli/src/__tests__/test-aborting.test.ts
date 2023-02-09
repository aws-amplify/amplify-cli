import { BannerMessage, FeatureFlags, HooksMeta, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import { Context } from '../domain/context';

describe('test SIGINT with execute', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('case: run', async () => {
    const input = { argv: ['/usr/local/bin/node', '/usr/local/bin/amplify-dev', '-v'], options: { v: true } };
    const mockExit = jest.fn();

    jest.spyOn(JSONUtilities, 'readJson').mockReturnValue({
      name: 'cli',
      version: '12.12.1',
    });
    jest.spyOn(JSONUtilities, 'stringify').mockReturnValue('');
    jest.spyOn(stateManager, 'getMeta');
    jest.spyOn(stateManager, 'teamProviderInfoExists').mockReturnValue(true);
    jest.spyOn(stateManager, 'localEnvInfoExists').mockReturnValue(true);
    jest.spyOn(stateManager, 'projectConfigExists').mockImplementation(() => true);
    jest.spyOn(FeatureFlags, 'initialize');
    jest.spyOn(BannerMessage, 'initialize');
    jest.spyOn(BannerMessage, 'getMessage');
    jest.spyOn(pathManager, 'getHomeDotAmplifyDirPath').mockReturnValue('homedir/.amplify');
    jest.spyOn(pathManager, 'getAWSCredentialsFilePath');
    jest.spyOn(pathManager, 'getAWSConfigFilePath');
    jest.spyOn(pathManager, 'findProjectRoot');
    jest.spyOn(HooksMeta, 'getInstance').mockReturnValue({ setAmplifyVersion: jest.fn(), setHookEventFromInput: jest.fn() } as any);

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
      getAmplifyLogger: jest.fn().mockReturnValue({
        logInfo: jest.fn(),
      }),
      Redactor: jest.fn(),
    });

    const mockContext: Context = jest.createMockFromModule('../domain/context');
    mockContext.input = input;
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

    setTimeout(() => {
      process.emit('SIGINT', 'SIGINT');
      process.exitCode = 2;
    }, 10);
    jest.spyOn(process, 'exit').mockImplementation(mockExit as any);

    // for some reason this test doesn't work when hoisting this require to a top level import
    // probably something to do with how the mocks are constructed
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    await require('../index').run(Date.now());
    expect(mockContext.usageData.emitAbort).toBeCalled();
    expect(mockContext.usageData.emitError).toHaveBeenCalledTimes(0);
    expect(mockContext.usageData.emitSuccess).toHaveBeenCalledTimes(0);
    expect(mockExit).toBeCalledWith(2);
  });
});

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
