import { Input } from '../domain/input';
import { PluginPlatform } from '../domain/plugin-platform';
import * as appConfig from '../app-config';
import { constructContext, attachUsageData } from '../context-manager';
import { Context } from '../domain/context';
import { PluginInfo } from '../domain/plugin-info';
import { PluginManifest } from '../domain/plugin-manifest';
import * as UsageData from '../domain/amplify-usageData';

jest.mock('../domain/amplify-usageData/', () => {
  return {
    UsageData: {
      Instance: {
        init: jest.fn(),
      },
    },
    NoUsageData: {
      Instance: {
        init: jest.fn(),
      },
    },
  };
});
jest.mock('../app-config');

describe('test attachUsageData', () => {
  const version = 'latestversion';
  const mockContext: Context = jest.genMockFromModule('../domain/context');

  mockContext.input = new Input([
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/node',
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/amplify',
    'status',
  ]);
  mockContext.pluginPlatform = new PluginPlatform();
  mockContext.pluginPlatform.plugins['core'] = [new PluginInfo('', version, '', new PluginManifest('', ''))];

  beforeAll(() => {});
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('constructContext', () => {
    const context = constructContext(mockContext.pluginPlatform, mockContext.input);
    expect(context).toBeDefined();
    expect(context.amplify).toBeDefined();
    expect(context.pluginPlatform).toEqual(mockContext.pluginPlatform);
    expect(context.input).toEqual(mockContext.input);
  });

  it('test with usage data enabled', () => {
    const returnValue = {
      usageDataConfig: {
        installationUuid: 'uuid',
        isUsageTrackingEnabled: true,
      },
      setValues: jest.fn(),
    };
    const mockedInit = appConfig.init as jest.Mock;
    mockedInit.mockReturnValue(returnValue);
    attachUsageData(mockContext);
    expect(UsageData.UsageData.Instance.init).toBeCalledWith(returnValue.usageDataConfig.installationUuid, version, mockContext.input);
  });

  it('test with usage data enabled', () => {
    const returnValue = {
      usageDataConfig: {
        installationUuid: 'uuid',
        isUsageTrackingEnabled: false,
      },
      setValues: jest.fn(),
    };
    const mockedInit = appConfig.init as jest.Mock;
    mockedInit.mockReturnValue(returnValue);
    attachUsageData(mockContext);
    expect(UsageData.NoUsageData.Instance.init).toBeCalledWith(returnValue.usageDataConfig.installationUuid, version, mockContext.input);
  });
});
