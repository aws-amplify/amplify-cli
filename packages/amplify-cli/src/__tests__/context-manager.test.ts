import { stateManager } from 'amplify-cli-core';
import { Input } from '../domain/input';
import { PluginPlatform } from '../domain/plugin-platform';
import * as appConfig from '../app-config';
import { constructContext, attachUsageData } from '../context-manager';
import { Context } from '../domain/context';
import { PluginInfo } from '../domain/plugin-info';
import { PluginManifest } from '../domain/plugin-manifest';
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
jest.mock('amplify-cli-core');

describe('test attachUsageData', () => {
  const version = 'latestVersion';
  const mockContext = jest.createMockFromModule<Context>('../domain/context');

  mockContext.input = new Input([
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
  };

  const stateManagerMocked = stateManager as jest.Mocked<typeof stateManager>;
  stateManagerMocked.metaFileExists.mockReturnValue(true);
  stateManagerMocked.getMeta.mockReturnValue({
    providers: {
      awscloudformation: {
        // eslint-disable-next-line spellcheck/spell-checker
        StackId: 'arn:aws:cloudformation:us-east-1:accountId:stack/amplify/8b4ba810-5208-11ec-bb0f-12f4d8376f67',
      },
    },
  });

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
