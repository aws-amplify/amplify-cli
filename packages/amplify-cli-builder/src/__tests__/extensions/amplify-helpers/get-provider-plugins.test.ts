import {
  getProviderPlugins,
  getConfiguredProviders,
  executeProviderCommand,
} from '../../../extensions/amplify-helpers/get-provider-plugins';
import { $TSContext, stateManager } from 'amplify-cli-core';

jest.mock('amplify-cli-core', () => ({
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
        directory: '../../../../__mocks__/faked-plugin',
      },
    ],
  },
} as $TSContext;

const mock_stateManager = stateManager as jest.Mocked<typeof stateManager>;

describe('getProviderPlugins', () => {
  it('should return providerPlugins', () => {
    const providerPlugins = getProviderPlugins(mockContext);
    expect(providerPlugins).toStrictEqual({ fakedPlugin: '../../../../__mocks__/faked-plugin' });
  });
});

describe('getConfiguredProviders', () => {
  it('should return configuredProviders', () => {
    mock_stateManager.getProjectConfig.mockImplementation(() => ({
      providers: ['fakedPlugin'],
    }));
    expect(getConfiguredProviders(mockContext)).toStrictEqual({ fakedPlugin: '../../../../__mocks__/faked-plugin' });
  });
  it('should throw error when configuredProviders is empty', () => {
    mock_stateManager.getProjectConfig.mockImplementation(() => {
      providers: [];
    });
    expect(() => {
      getConfiguredProviders(mockContext);
    }).toThrow('No providers are configured for the project');
  });
  it('should throw error when configuredProviders is undefined', () => {
    mock_stateManager.getProjectConfig.mockImplementation(() => undefined);
    expect(() => {
      getConfiguredProviders(mockContext);
    }).toThrow('No providers are configured for the project');
  });
});

describe('executeProviderCommand', () => {
  it('should execute the function of plugins', () => {
    mock_stateManager.getProjectConfig.mockImplementation(() => ({ fakedPlugin: '../../../../__mocks__/faked-plugin' }));
    expect(executeProviderCommand(mockContext, 'fakedPlugin')).resolves.toEqual({});
  });
});
