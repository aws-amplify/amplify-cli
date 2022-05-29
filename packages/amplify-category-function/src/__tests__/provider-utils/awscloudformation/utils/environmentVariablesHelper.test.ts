import {
  ensureEnvironmentVariableValues,
  getStoredEnvironmentVariables,
  saveEnvironmentVariables,
} from '../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper';

import { stateManager, pathManager, JSONUtilities, $TSContext } from 'amplify-cli-core';
import { prompter } from 'amplify-prompts';

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const prompter_mock = prompter as jest.Mocked<typeof prompter>;

stateManager_mock.getLocalEnvInfo.mockReturnValue({ envName: 'testenv' });

pathManager_mock.findProjectRoot.mockReturnValue('');
pathManager_mock.getBackendDirPath.mockReturnValue('');
pathManager_mock.getTeamProviderInfoFilePath.mockReturnValue('');

beforeEach(() => jest.clearAllMocks());

describe('getStoredEnvironmentVariables', () => {
  it('does not throw error', () => {
    expect(getStoredEnvironmentVariables('test')).toEqual({});
  });
});

describe('deleteEnvironmentVariable', () => {
  it('does not throw error', () => {
    expect(() => {
      saveEnvironmentVariables('name', { test: 'test' });
    }).not.toThrow();
  });
});

describe('ensureEnvironmentVariableValues', () => {
  it('appends to existing env vars', async () => {
    stateManager_mock.getTeamProviderInfo.mockReturnValue({
      testenv: {
        categories: {
          function: {
            testfunc: {
              envVarOne: 'testval1',
            },
          },
        },
      },
    });

    JSONUtilities_mock.readJson.mockReturnValueOnce({
      environmentVariableList: [
        {
          cloudFormationParameterName: 'envVarOne',
          environmentVariableName: 'envVarOne',
        },
        {
          cloudFormationParameterName: 'envVarTwo',
          environmentVariableName: 'envVarTwo',
        },
        {
          cloudFormationParameterName: 'envVarThree',
          environmentVariableName: 'envVarThree',
        },
      ],
    });

    prompter_mock.input.mockResolvedValueOnce('testVal2').mockResolvedValueOnce('testVal3');

    await ensureEnvironmentVariableValues({ usageData: { emitError: jest.fn() } } as $TSContext);
    expect(stateManager_mock.setTeamProviderInfo.mock.calls[0][1].testenv.categories.function.testfunc).toEqual({
      envVarOne: 'testval1',
      envVarTwo: 'testVal2',
      envVarThree: 'testVal3',
    });
  });
});
