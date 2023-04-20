import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import {
  getProviderPlugins,
  getConfiguredProviders,
  executeProviderCommand,
} from '../../../extensions/amplify-helpers/get-provider-plugins';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  stateManager: {
    getProjectConfig: jest.fn(),
  },
}));

const mockContext = {
  runtime: {
    plugins: [
      {
        pluginType: 'provider',
        pluginName: 'fakedPlugin',
        directory: '../../../__mocks__/faked-plugin',
      },
    ],
  },
} as $TSContext;

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
beforeEach(() => {
  jest.clearAllMocks();
});

describe('getProviderPlugins', () => {
  it('should return providerPlugins', () => {
    const providerPlugins = getProviderPlugins(mockContext);
    expect(providerPlugins).toStrictEqual({ fakedPlugin: '../../../__mocks__/faked-plugin' });
  });
});

describe('getConfiguredProviders', () => {
  it('should return configuredProviders', () => {
    stateManagerMock.getProjectConfig.mockImplementation(() => ({
      providers: ['fakedPlugin'],
    }));
    expect(getConfiguredProviders(mockContext)).toStrictEqual({ fakedPlugin: '../../../__mocks__/faked-plugin' });
  });
  it('should throw error when configuredProviders is empty', () => {
    stateManagerMock.getProjectConfig.mockImplementation(() => ({
      providers: [],
    }));
    expect(() => {
      getConfiguredProviders(mockContext);
    }).toThrow('No providers are configured for the project');
  });
  it('should throw error when configuredProviders is undefined', () => {
    stateManagerMock.getProjectConfig.mockImplementation(() => undefined);
    expect(() => {
      getConfiguredProviders(mockContext);
    }).toThrow('No providers are configured for the project');
  });
});

describe('executeProviderCommand', () => {
  it('should execute the function of plugins', async () => {
    stateManagerMock.getProjectConfig.mockReturnValue({ providers: ['fakedPlugin'] });
    const consoleLogSpy = jest.spyOn(console, 'log');
    await executeProviderCommand(mockContext, 'fakedPlugin');
    expect(consoleLogSpy).toHaveBeenLastCalledWith('fakePluginResult');
  });
});
