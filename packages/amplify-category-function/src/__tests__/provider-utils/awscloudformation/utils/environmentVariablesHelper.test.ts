import { stateManager, JSONUtilities, $TSContext, pathManager } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import * as envVarHelper from '../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper';
import * as uuid from 'uuid';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('uuid');

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
const JSONUtilitiesMock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
const prompterMock = prompter as jest.Mocked<typeof prompter>;

pathManagerMock.findProjectRoot.mockReturnValue('');
pathManagerMock.getBackendDirPath.mockReturnValue('');
pathManagerMock.getTeamProviderInfoFilePath.mockReturnValue('');

const envName = 'testEnv';

stateManagerMock.getLocalEnvInfo.mockReturnValue({ envName });
stateManagerMock.getTeamProviderInfo.mockReturnValue({
  [envName]: {
    categories: {
      function: {
        testFunc: {
          envVarOne: 'testVal1',
        },
      },
    },
  },
});

stateManagerMock.getBackendConfig.mockReturnValue({
  function: {
    testFunc: {},
  },
});

let ensureEnvParamManager;
let getEnvParamManager;

beforeEach(async () => {
  ({ ensureEnvParamManager, getEnvParamManager } = await import('@aws-amplify/amplify-environment-parameters'));
  await ensureEnvParamManager(envName);
  jest.clearAllMocks();
});

describe('getStoredEnvironmentVariables', () => {
  it('empty return value when resource name does not exist', () => {
    const value = envVarHelper.getStoredEnvironmentVariables('test');
    expect(value).toEqual({});
  });
});

describe('deleteEnvironmentVariable', () => {
  it('does not throw error', () => {
    expect(() => {
      envVarHelper.saveEnvironmentVariables('name', { test: 'test' });
    }).not.toThrow();
  });
});

describe('ensureEnvironmentVariableValues', () => {
  it('appends to existing env vars', async () => {
    JSONUtilitiesMock.readJson.mockReturnValueOnce({
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

    prompterMock.input.mockResolvedValueOnce('testVal2').mockResolvedValueOnce('testVal3');

    await envVarHelper.ensureEnvironmentVariableValues({ usageData: { emitError: jest.fn() } } as unknown as $TSContext, 'testAppId');
    expect(getEnvParamManager().getResourceParamManager('function', 'testFunc').getAllParams()).toEqual({
      envVarOne: 'testVal1',
      envVarTwo: 'testVal2',
      envVarThree: 'testVal3',
    });
  });
});

describe('askEnvironmentVariableCarryOrUpdateQuestions', () => {
  const emptyRecord = {} as Record<string, string>;
  const testFuncRecord = { [envName]: 'testFunc' };
  const context = {} as $TSContext;
  const abortKey = 'abort_token';
  const uuidMock = uuid as jest.Mocked<typeof uuid>;
  const spyOnGetStoredEnvironmentVariables = jest.spyOn(envVarHelper, 'getStoredEnvironmentVariables');

  const howToProceedChoices = [
    {
      value: 'carry',
      name: 'Carry over existing environment variables to this new environment',
    },
    {
      value: 'update',
      name: 'Update environment variables now',
    },
  ];
  const functionNames = ['testFunc'];
  const selectFunctionChoices = functionNames
    .map((name) => ({
      name,
      value: name,
    }))
    .concat({
      name: "I'm done",
      value: abortKey,
    });
  const selectVariablesChoices = ['testEnv']
    .map((name) => ({
      name,
      value: name,
    }))
    .concat({
      name: "I'm done",
      value: abortKey,
    });

  beforeAll(() => {
    uuidMock.v4.mockReset();
    spyOnGetStoredEnvironmentVariables.mockReset();

    uuidMock.v4.mockReturnValue(abortKey);
    spyOnGetStoredEnvironmentVariables.mockReturnValue(testFuncRecord);
  });

  beforeEach(() => {
    prompterMock.pick.mockReset();
    prompterMock.input.mockReset();
  });

  afterAll(() => {
    prompterMock.pick.mockReset();
    prompterMock.input.mockReset();
    spyOnGetStoredEnvironmentVariables.mockReset();
  });

  it('does not prompt when no functions exist', async () => {
    stateManagerMock.getBackendConfig.mockReturnValueOnce({
      function: {},
    });

    await envVarHelper.askEnvironmentVariableCarryOrUpdateQuestions(context, envName, false);

    expect(prompterMock.pick).toBeCalledTimes(0);
  });

  it.each([
    {
      fromEnvName: envName,
      yesFlagSet: true,
      numCalls: 0,
      storedEnvVar: testFuncRecord,
    },
    {
      fromEnvName: envName,
      yesFlagSet: false,
      numCalls: 0,
      storedEnvVar: emptyRecord,
    },
    {
      fromEnvName: envName,
      yesFlagSet: true,
      numCalls: 0,
      storedEnvVar: emptyRecord,
    },
    {
      fromEnvName: envName,
      yesFlagSet: false,
      numCalls: 1,
      storedEnvVar: testFuncRecord,
    },
  ])(
    'calls prompt $numCalls times when yesFlagSet is $yesFlagSet and environment variables is $storedEnvVar',
    async ({ fromEnvName, yesFlagSet, numCalls, storedEnvVar }) => {
      spyOnGetStoredEnvironmentVariables.mockReturnValueOnce(storedEnvVar);
      prompterMock.pick.mockResolvedValueOnce('carry');

      await envVarHelper.askEnvironmentVariableCarryOrUpdateQuestions(context, fromEnvName, yesFlagSet);

      expect(prompterMock.pick).toBeCalledTimes(numCalls);
    },
  );

  it('prompts the user with a specific question when the environment has lambda functions and the yes flag is not set', async () => {
    prompterMock.pick.mockResolvedValueOnce('carry');

    await envVarHelper.askEnvironmentVariableCarryOrUpdateQuestions(context, envName, false);

    expect(prompterMock.pick).toBeCalledWith(
      'You have configured environment variables for functions. How do you want to proceed?',
      howToProceedChoices,
      expect.anything(),
    );
  });

  it.each([
    { numCarryUpdateCalls: 1, answer: 'carry', numSelectFunctionCalls: 0 },
    { numCarryUpdateCalls: 1, answer: 'update', numSelectFunctionCalls: 1 },
  ])(
    'prompts the user $numSelectFunctionCalls times when the first question is answered with $answer',
    async ({ numCarryUpdateCalls, answer, numSelectFunctionCalls: numSelectFunctionCalls }) => {
      prompterMock.pick.mockResolvedValueOnce(answer);
      prompterMock.pick.mockResolvedValueOnce(abortKey);

      await envVarHelper.askEnvironmentVariableCarryOrUpdateQuestions(context, envName, false);

      expect(prompterMock.pick).toBeCalledTimes(numCarryUpdateCalls + numSelectFunctionCalls);
    },
  );

  it('prompts the user with a specific question and choices when update is selected', async () => {
    prompterMock.pick.mockResolvedValueOnce('update');
    prompterMock.pick.mockResolvedValueOnce(abortKey);

    await envVarHelper.askEnvironmentVariableCarryOrUpdateQuestions(context, envName, false);

    expect(prompterMock.pick).toHaveBeenCalledTimes(2);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(
      1,
      'You have configured environment variables for functions. How do you want to proceed?',
      howToProceedChoices,
      expect.anything(),
    );
    expect(prompterMock.pick).toHaveBeenNthCalledWith(2, 'Select the Lambda function you want to update values', selectFunctionChoices);
  });

  it('prompts the user with a specific question and choices when function is selected', async () => {
    prompterMock.pick.mockResolvedValueOnce('update');
    prompterMock.pick.mockResolvedValueOnce('testFunc');
    prompterMock.pick.mockResolvedValueOnce(abortKey); // select variable
    prompterMock.pick.mockResolvedValueOnce(abortKey); // select function

    await envVarHelper.askEnvironmentVariableCarryOrUpdateQuestions(context, envName, false);

    expect(prompterMock.pick).toHaveBeenCalledTimes(4);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(
      1,
      'You have configured environment variables for functions. How do you want to proceed?',
      howToProceedChoices,
      expect.anything(),
    );
    expect(prompterMock.pick).toHaveBeenNthCalledWith(2, 'Select the Lambda function you want to update values', selectFunctionChoices);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(
      3,
      "Which function's environment variables do you want to edit?",
      selectVariablesChoices,
    );
  });

  it('prompts the user to provide a new variable value when a variable is selected', async () => {
    prompterMock.pick.mockResolvedValueOnce('update');
    prompterMock.pick.mockResolvedValueOnce('testFunc');
    prompterMock.pick.mockResolvedValueOnce('testEnv');
    prompterMock.input.mockResolvedValueOnce('testVal');
    prompterMock.pick.mockResolvedValueOnce(abortKey);
    prompterMock.pick.mockResolvedValueOnce(abortKey);

    await envVarHelper.askEnvironmentVariableCarryOrUpdateQuestions(context, envName, false);

    // Expecting anything for optional prompter parameters.
    expect(prompterMock.input).toHaveBeenCalledWith('Enter the environment variable value:', expect.anything());
  });
});
