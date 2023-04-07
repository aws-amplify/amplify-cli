import { prompter } from '@aws-amplify/amplify-prompts';
import { start as lambdaServerStart } from '../../func';
import { $TSAny } from 'amplify-cli-core';

jest.mock('../../func');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  FeatureFlags: {
    getNumber: jest.fn(),
  },
}));

const prompter_mock = prompter as jest.Mocked<typeof prompter>;
prompter_mock.pick.mockResolvedValue(['func1', 'func2', 'func3']);
const lambdaServerStartMock = lambdaServerStart as jest.MockedFunction<typeof lambdaServerStart>;

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
      getMeta: () => ({
        function: {
          func1: {},
          func2: {},
          func3: {},
        },
      }),
    },
  };

  it('prompts for multiple functions and selects the resource name', async () => {
    await lambdaServerStart(context_stub);
    expect(lambdaServerStartMock).toBeCalledTimes(1);
  });
});
