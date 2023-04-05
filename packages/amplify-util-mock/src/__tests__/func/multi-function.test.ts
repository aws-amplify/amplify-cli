import { $TSAny } from 'amplify-cli-core';
import { start } from '../../func';
import { prompter } from '@aws-amplify/amplify-prompts';
import { stateManager } from 'amplify-cli-core';
import _ from 'lodash';

jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../utils/lambda/load-lambda-config', () => ({
  loadLambdaConfig: jest.fn(() => ({ handler: 'index.testHandle' })),
}));
jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
  },
  pathManager: {
    getBackendDirPath: () => 'fake-backend-path',
  },
  stateManager: {
    getMeta: jest.fn().mockReturnValue({}),
  },
}));
jest.mock('@aws-amplify/amplify-category-function', () => ({
  getInvoker: jest.fn().mockResolvedValue(() => new Promise((resolve) => setTimeout(() => resolve('lambda value'), 10))),
  getBuilder: jest.fn().mockReturnValue(() => {}),
  isMockable: jest.fn().mockReturnValue({ isMockable: true }),
  category: 'function',
}));

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
const prompter_mock = prompter as jest.Mocked<typeof prompter>;

describe('multiple function start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const context_stub: $TSAny = {
    input: {
      options: {
        event: 'event.json',
        timeout: 1,
      },
    },
    amplify: {
      inputValidation: () => () => true,
      readJsonFile: jest.fn(),
      getResourceStatus: () => ({ allResources: [] }),
      getEnvInfo: () => ({ envName: 'testing' }),
    },
  };

  it('prompts for multiple functions and selects the resource name', async () => {
    const context_stub_copy = _.merge({}, context_stub);

    stateManager_mock.getMeta.mockReturnValueOnce({
      function: {
        func1: {},
        func2: {},
        func3: {},
      },
    });
    prompter_mock.pick.mockResolvedValue(['func1', 'func2', 'func3']);
    await start(context_stub_copy);

    expect(prompter_mock.pick).toBeCalled();
  });
});
