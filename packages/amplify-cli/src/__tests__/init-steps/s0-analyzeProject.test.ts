import { $TSContext, stateManager } from 'amplify-cli-core';
import { analyzeProject } from '../../init-steps/s0-analyzeProject';
import { constructMockPluginPlatform } from '../extensions/amplify-helpers/mock-plugin-platform';
import { Input } from '../../domain/input';
import { constructContext } from '../../context-manager';

jest.mock('amplify-cli-core');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
stateManagerMock.getLocalAWSInfo.mockReturnValue({ envA: 'test', envB: 'test' });
stateManagerMock.getLocalEnvInfo.mockReturnValue({ defaultEditor: 'Visual Studio Code' });
stateManagerMock.getTeamProviderInfo.mockReturnValue({});

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
    const mockInput = new Input(mockProcessArgv);
    mockContext = constructContext(mockPluginPlatform, mockInput) as unknown as $TSContext;
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
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* noop */ });
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
    stateManagerMock.getLocalAWSInfo.mockReturnValue({});
    stateManagerMock.getTeamProviderInfo.mockReturnValue({ test: {}, other: {} });
    await analyzeProject(mockContext);
    expect(mockContext.exeInfo.isNewEnv).toBe(false);
  });

  it('sets isNewEnv true in context when env does not exists in tpi file', async () => {
    mockContext.exeInfo.inputParams = {
      amplify: {
        envName: 'new',
      },
    };
    stateManagerMock.getLocalAWSInfo.mockReturnValue({});
    stateManagerMock.getTeamProviderInfo.mockReturnValue({ test: {}, other: {} });
    await analyzeProject(mockContext);
    expect(mockContext.exeInfo.isNewEnv).toBe(true);
  });
});
