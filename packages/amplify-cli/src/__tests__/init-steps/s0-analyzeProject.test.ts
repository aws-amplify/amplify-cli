import { $TSContext, AmplifyError, stateManager } from '@aws-amplify/amplify-cli-core';
import { analyzeProject } from '../../init-steps/s0-analyzeProject';
import { constructMockPluginPlatform } from '../extensions/amplify-helpers/mock-plugin-platform';
import { CLIInput as CommandLineInput } from '../../domain/command-input';
import { constructContext } from '../../context-manager';
import * as fs from 'fs-extra';

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
    mockContext = constructContext(mockPluginPlatform, mockInput) as unknown as $TSContext;
    const frontendPlugins = [
      {
        name: '@aws-amplify/amplify-frontend-javascript',
        pluginType: 'frontend',
        pluginName: 'javascript',
        directory: '@aws-amplify/amplify-frontend-javascript',
      },
      {
        name: '@aws-amplify/amplify-frontend-flutter',
        pluginType: 'frontend',
        pluginName: 'flutter',
        directory: '@aws-amplify/amplify-frontend-flutter',
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

  it('throws helpful error message when running subsequent init -y commands', async () => {
    const appID = 'testAppID';
    const currentEnv = 'dev';

    mockContext.parameters = {
      options: {
        yes: true,
      },
    };

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(stateManager, 'getAppID').mockReturnValue(appID);
    jest.spyOn(stateManager, 'getCurrentEnvName').mockReturnValue(currentEnv);

    const amplifyError = new AmplifyError('ProjectInitError', {
      message: `Amplify project ${appID} is already initialized for environment ${currentEnv}`,
      resolution: `To create a new environment run \`amplify add env\``,
    });

    await expect(analyzeProject(mockContext)).rejects.toThrow(amplifyError);
  });
});
