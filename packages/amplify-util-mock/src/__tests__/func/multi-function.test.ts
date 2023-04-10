import { prompter } from '@aws-amplify/amplify-prompts';
import { start as lambdaServerStart } from '../../func';
import { $TSAny } from 'amplify-cli-core';
import { getInvoker as invoker } from '@aws-amplify/amplify-category-function';

jest.mock('../../func');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('../../../../amplify-dynamodb-simulator');
jest.mock('@aws-amplify/amplify-category-function');

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('../../../../amplify-dynamodb-simulator'),
    getAmplifyLibRoot: jest.fn().mockReturnValue(''),
    getAWSCredentialsFilePath: jest.fn().mockReturnValue(''),
    getAWSConfigFilePath: jest.fn().mockReturnValue(''),
  },
  FeatureFlags: {
    getNumber: jest.fn(),
  },
}));

const prompter_mock = prompter as jest.Mocked<typeof prompter>;
prompter_mock.pick.mockResolvedValue(['func1', 'func2', 'func3']);
const lambdaServerStartMock = lambdaServerStart as jest.MockedFunction<typeof lambdaServerStart>;
const invoker_mock = invoker as jest.MockedFunction<typeof invoker>;

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

  it('checks if the lambda server and invoker has been called for all functions', async () => {
    await lambdaServerStart(context_stub);
    expect(lambdaServerStartMock).toBeCalledTimes(1);

    //iterates over the function names and checks if invoker has been called
    const resourceNames = Object.keys(context_stub.amplify.getMeta().function);
    for (const resourceName of resourceNames.filter(Boolean)) {
      invoker(context_stub, {
        resourceName,
        handler: '',
      });
      expect(invoker_mock).toBeCalled();
    }
  });
});
