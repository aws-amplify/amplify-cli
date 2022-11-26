import * as fs from 'fs-extra';
import * as path from 'path';
import { $TSContext, pathManager } from 'amplify-cli-core';
import { APITest } from '../../api/api';
import * as lambdaInvoke from '../../api/lambda-invoke';
import { getMockSearchableTriggerDirectory } from '../../utils';

jest.mock('amplify-cli-core');
jest.mock('amplify-dynamodb-simulator', () => jest.fn());
jest.mock('fs-extra');

const mockProjectRoot = 'mock-app';
const mockContext = {
  amplify: {
    getEnvInfo: jest.fn().mockReturnValue({ projectPath: mockProjectRoot }),
    loadRuntimePlugin: jest.fn().mockReturnValue({})
  }
} as unknown as $TSContext;

describe('Test Mock API methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pathManager.getAmplifyPackageLibDirPath = jest.fn().mockReturnValue('backend');
  });

  it('attempts to copy searchable lambda trigger artifacts correctly', async () => {
    const searchableLambdaResourceDir = path.resolve(__dirname, '..', '..', '..', 'resources', 'mock-searchable-lambda-trigger');
    const mockSearchableTriggerDirectory = getMockSearchableTriggerDirectory(mockContext);

    const testApi = new APITest();
    const testApiProto = Object.getPrototypeOf(testApi);
    jest.spyOn(lambdaInvoke, 'buildLambdaTrigger').mockResolvedValueOnce();
    await testApiProto.createMockSearchableArtifacts(mockContext);

    expect(fs.copySync).toBeCalledTimes(2);

    // copies the pipfile artifact from correct location
    expect(fs.copySync).toBeCalledWith(
      path.join(searchableLambdaResourceDir, 'Pipfile'),
      path.join(mockSearchableTriggerDirectory, 'Pipfile'),
      { overwrite: true }
    );

    // copies the source files artifacts from correct location
    expect(fs.copySync).toBeCalledWith(
      path.join(searchableLambdaResourceDir, 'source-files'),
      path.join(mockSearchableTriggerDirectory, 'src'),
      { overwrite: true }
    );
  });
});