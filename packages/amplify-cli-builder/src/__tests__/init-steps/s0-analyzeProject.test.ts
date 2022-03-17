import { $TSContext } from 'amplify-cli-core';
import { analyzeProject } from '../../init-steps/s0-analyzeProject';
import { constructMockPluginPlatform } from '../extensions/amplify-helpers/mock-plugin-platform';
import { Input } from '../../domain/input';
import { constructContext } from '../../context-manager';

describe('analyzeProject', () => {
  it('recognizes the default editor', async () => {
    const mockPluginPlatform = constructMockPluginPlatform();
    const mockProcessArgv = [
      '/Users/userName/.nvm/versions/node/v12.16.1/bin/node',
      '/Users/userName/.nvm/versions/node/v12.16.1/bin/amplify',
      'init',
      '-y',
    ];
    const mockInput = new Input(mockProcessArgv);
    const mockContext = constructContext(mockPluginPlatform, mockInput) as unknown as $TSContext;
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
    const result = await analyzeProject(mockContext);
    expect(result.exeInfo.localEnvInfo.defaultEditor).toStrictEqual('Visual Studio Code');
  });
});
