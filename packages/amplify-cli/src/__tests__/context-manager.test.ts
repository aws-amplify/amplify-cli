import { PluginPlatform, stateManager, PluginInfo, PluginManifest } from '@aws-amplify/amplify-cli-core';
import { CLIInput as CommandLineInput } from '../domain/command-input';
import * as appConfig from '../app-config';
import { constructContext, attachUsageData } from '../context-manager';
import { Context } from '../domain/context';
import { UsageData, NoUsageData } from '../domain/amplify-usageData';

jest.mock('../domain/amplify-usageData/', () => ({
  UsageData: {
    Instance: {
      setIsHeadless: jest.fn(),
      init: jest.fn(),
    },
  },
  NoUsageData: {
    Instance: {
      setIsHeadless: jest.fn(),
      init: jest.fn(),
    },
  },
  CLINoFlowReport: {
    instance: jest.fn(() => ({
      setIsHeadless: jest.fn(),
    })),
  },
}));
jest.mock('../app-config');
describe('test attachUsageData', () => {
  const version = 'latestVersion';
  const mockContext = jest.createMockFromModule<Context>('../domain/context');

  mockContext.input = new CommandLineInput([
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/node',
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/amplify',
    'status',
  ]);
  mockContext.pluginPlatform = new PluginPlatform();
  mockContext.pluginPlatform.plugins.core = [new PluginInfo('', version, '', new PluginManifest('', ''))];
  mockContext.usageData = {
    init: jest.fn(),
    setIsHeadless: jest.fn(),
    emitError: jest.fn(),
    emitAbort: jest.fn(),
    emitSuccess: jest.fn(),
    startCodePathTimer: jest.fn(),
    stopCodePathTimer: jest.fn(),
    pushHeadlessFlow: jest.fn(),
    pushInteractiveFlow: jest.fn(),
    getFlowReport: jest.fn(),
    assignProjectIdentifier: jest.fn(),
    getUsageDataPayload: jest.fn(),
    calculatePushNormalizationFactor: jest.fn(),
    getSessionUuid: jest.fn(),
  };

  jest.spyOn(stateManager, 'getMeta').mockReturnValue({
    providers: {
      awscloudformation: {
        // eslint-disable-next-line spellcheck/spell-checker
        StackId: 'arn:aws:cloudformation:us-east-1:accountId:stack/amplify/8b4ba810-5208-11ec-bb0f-12f4d8376f67',
      },
    },
  });
  jest.spyOn(stateManager, 'metaFileExists').mockReturnValue(true);

  it('constructContext', () => {
    const context = constructContext(mockContext.pluginPlatform, mockContext.input);
    expect(context).toBeDefined();
    expect(context.amplify).toBeDefined();
    expect(context.pluginPlatform).toEqual(mockContext.pluginPlatform);
    expect(context.input).toEqual(mockContext.input);
  });

  it('test with usage data enabled', async () => {
    const returnValue = {
      usageDataConfig: {
        installationUuid: 'uuid',
        isUsageTrackingEnabled: true,
      },
      setValues: jest.fn(),
    };
    const mockedInit = appConfig.init as jest.Mock;
    mockedInit.mockReturnValue(returnValue);
    const ts = Date.now();
    await attachUsageData(mockContext, ts);
    expect(UsageData.Instance.init).toBeCalledWith(
      returnValue.usageDataConfig.installationUuid,
      version,
      mockContext.input,
      'accountId',
      {},
      ts,
    );
  });

  it('test with usage data disabled', async () => {
    const returnValue = {
      usageDataConfig: {
        installationUuid: 'uuid',
        isUsageTrackingEnabled: false,
      },
      setValues: jest.fn(),
    };
    const mockedInit = appConfig.init as jest.Mock;
    mockedInit.mockReturnValue(returnValue);
    const ts = Date.now();
    await attachUsageData(mockContext, ts);
    expect(NoUsageData.Instance.init).toBeCalledWith(
      returnValue.usageDataConfig.installationUuid,
      version,
      mockContext.input,
      'accountId',
      {},
      ts,
    );
  });
});
