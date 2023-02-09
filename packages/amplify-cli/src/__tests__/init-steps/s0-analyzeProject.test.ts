import { $TSContext, stateManager, CommandLineInput } from 'amplify-cli-core';
import { analyzeProject } from '../../init-steps/s0-analyzeProject';
import { constructMockPluginPlatform } from '../extensions/amplify-helpers/mock-plugin-platform';
import { constructContext } from '../../context-manager';

jest.spyOn(stateManager, 'getLocalAWSInfo').mockReturnValue({ envA: 'test', envB: 'test' });
jest.spyOn(stateManager, 'getLocalEnvInfo').mockReturnValue({ defaultEditor: 'Visual Studio Code' });
jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({});

describe('analyzeProject', () => {
  let mockContext;
  beforeEach(() => {
    const mockPluginPlatform = constructMockPluginPlatform();
    const mockProcessArgv = [
      '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
      '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
      'init',
      '-y',
    ];
    const mockInput = new CommandLineInput(mockProcessArgv);
    mockContext = (constructContext(mockPluginPlatform, mockInput) as unknown) as $TSContext;
    const frontendPlugins = [
      {
        name: 'amplify-frontend-javascript',
        pluginType: 'frontend',
        pluginName: 'javascript',
        directory: 'amplify-frontend-javascript',
      },
      {
        name: 'amplify-frontend-flutter',
        pluginType: 'frontend',
        pluginName: 'flutter',
        directory: 'amplify-frontend-flutter',
      },
    ];
    mockContext.exeInfo = {
      inputParams: {},
      localEnvInfo: {
        defaultEditor: 'Visual Studio Code',
      },
    };
    mockContext.runtime.plugins.push(...frontendPlugins);
  });

  it('recognizes the default editor', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
      /* noop */
    });
    const result = await analyzeProject(mockContext);
    expect(result.exeInfo.localEnvInfo.defaultEditor).toStrictEqual('Visual Studio Code');
    consoleLogSpy.mockClear();
  });

  it('sets isNewEnv false in context when env exists in tpi file', async () => {
    mockContext.exeInfo.inputParams = {
      amplify: {
        envName: 'test',
      },
    };
    jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({ test: {}, other: {} });
    jest.spyOn(stateManager, 'getLocalAWSInfo').mockReturnValue({});
    await analyzeProject(mockContext);
    expect(mockContext.exeInfo.isNewEnv).toBe(false);
  });

  it('sets isNewEnv true in context when env does not exists in tpi file', async () => {
    mockContext.exeInfo.inputParams = {
      amplify: {
        envName: 'new',
      },
    };
    jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({ test: {}, other: {} });
    jest.spyOn(stateManager, 'getLocalAWSInfo').mockReturnValue({});
    await analyzeProject(mockContext);
    expect(mockContext.exeInfo.isNewEnv).toBe(true);
  });
});
