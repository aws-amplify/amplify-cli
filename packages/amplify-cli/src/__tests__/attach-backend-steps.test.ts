import { analyzeProject } from '../attach-backend-steps/a20-analyzeProject';
import { $TSContext, stateManager } from 'amplify-cli-core';

jest.mock('amplify-cli-core');
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

const contextStub = {
  exeInfo: {
    projectConfig: {
      projectName: 'this-is-a-possible-name-from-the-console!',
      version: '3.1',
    },
    localEnvInfo: {},
  },
} as $TSContext;

describe('a20-analyzeProject', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('long console name', async () => {
    stateManager_mock.getLocalEnvInfo.mockReturnValueOnce({ defaultEditor: 'gedit' });
    await analyzeProject(contextStub);
    expect(contextStub.exeInfo.projectConfig.projectName.length).toBe(20);
  });
});
