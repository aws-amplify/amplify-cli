import { prompter } from 'amplify-prompts';
import * as envVarHelper from '../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper';
import * as envVarWalkthrough from '../../../../provider-utils/awscloudformation/service-walkthroughs/environmentVariableWalkthrough';

jest.mock('amplify-prompts');
jest.mock('../../../../provider-utils/awscloudformation/secrets/functionSecretsStateManager');
jest.mock('../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper');

describe('askEnvironmentVariableQuestions', () => {
  const testResourceName = 'test';
  let testRecord = { testKey: 'testVal' } as Record<string, string>;

  // mocks
  const prompterMock = prompter as jest.Mocked<typeof prompter>;
  const spyOnGetStoredEnvironmentVariables = jest.spyOn(envVarHelper, 'getStoredEnvironmentVariables');

  beforeAll(() => {
    spyOnGetStoredEnvironmentVariables.mockReturnValue({});
  });

  beforeEach(() => {
    prompterMock.input.mockReset();
    prompterMock.pick.mockReset();
    testRecord = { testKey: 'testVal' } as Record<string, string>;
  });

  afterAll(() => {
    prompterMock.input.mockReset();
    prompterMock.pick.mockReset();
    spyOnGetStoredEnvironmentVariables.mockReset();
  });

  it('does not throw error', () => {
    expect(async () => {
      // need to mock the first prompt value or we loop forever on an undefined return
      prompterMock.pick.mockResolvedValueOnce('abort');
      await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName);
    }).not.toThrow();
  });

  it('does not prompt when skipping walkthrough', async () => {
    await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName, testRecord, true);

    expect(prompterMock.pick).toBeCalledTimes(0);
  });

  it('prompts for operation when not skipping walkthrough', async () => {
    prompterMock.pick.mockResolvedValueOnce('abort');

    await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName, testRecord, false);

    expect(prompterMock.pick).toHaveBeenCalledTimes(1);
    const { message, choices } = getPrompterOperationalChoices(true, true);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(1, message, choices, expect.anything());
  });

  it('prompts for variable name and value when "add" is chosen', async () => {
    prompterMock.pick.mockResolvedValueOnce('add');
    prompterMock.input.mockResolvedValueOnce('testKey2');
    prompterMock.input.mockResolvedValueOnce('testVal2');
    prompterMock.pick.mockResolvedValueOnce('abort');

    await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName, testRecord, false);

    expect(prompterMock.pick).toHaveBeenCalledTimes(2);
    expect(prompterMock.input).toHaveBeenCalledTimes(2);
    expect(prompterMock.input).toHaveBeenNthCalledWith(1, 'Enter the environment variable name:', expect.anything());
    expect(prompterMock.input).toHaveBeenNthCalledWith(2, 'Enter the environment variable value:', expect.anything());
    const { message, choices } = getPrompterOperationalChoices(true, false);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(2, message, choices, expect.anything());
  });

  it('updates environment variable record added values when "add" is chosen', async () => {
    prompterMock.pick.mockResolvedValueOnce('add');
    prompterMock.input.mockResolvedValueOnce('testKey2');
    prompterMock.input.mockResolvedValueOnce('testVal2');
    prompterMock.pick.mockResolvedValueOnce('abort');

    await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName, testRecord, false);

    const expectedValue = { testKey: 'testVal', testKey2: 'testVal2' } as Record<string, string>;
    expect(testRecord).toEqual(expectedValue);
  });

  it('prompts for variable name and value when "update" is chosen', async () => {
    const targetVariable = 'testKey';
    const updatedVariable = targetVariable;
    const updatedValue = 'testVal3';
    prompterMock.pick.mockResolvedValueOnce('update');
    prompterMock.pick.mockResolvedValueOnce(targetVariable);
    prompterMock.input.mockResolvedValueOnce(updatedVariable);
    prompterMock.input.mockResolvedValueOnce(updatedValue);
    prompterMock.pick.mockResolvedValueOnce('abort');

    await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName, testRecord, false);

    expect(prompterMock.pick).toHaveBeenCalledTimes(3);
    expect(prompterMock.input).toHaveBeenCalledTimes(2);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(2, 'Which environment variable do you want to update:', ['testKey']);
    expect(prompterMock.input).toHaveBeenNthCalledWith(1, 'Enter the environment variable name:', expect.anything());
    expect(prompterMock.input).toHaveBeenNthCalledWith(2, 'Enter the environment variable value:', expect.anything());
    const { message, choices } = getPrompterOperationalChoices(true, false);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(3, message, choices, expect.anything());
  });

  it('updates environment variable record with new value when "update" is chosen', async () => {
    const targetVariable = 'testKey';
    const updatedVariable = targetVariable;
    const updatedValue = 'testVal3';
    prompterMock.pick.mockResolvedValueOnce('update');
    prompterMock.pick.mockResolvedValueOnce(targetVariable);
    prompterMock.input.mockResolvedValueOnce(updatedVariable);
    prompterMock.input.mockResolvedValueOnce(updatedValue);
    prompterMock.pick.mockResolvedValueOnce('abort');

    await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName, testRecord, false);

    const expectedValue = { [updatedVariable]: updatedValue } as Record<string, string>;
    expect(testRecord).toEqual(expectedValue);
  });

  it('prompts for variable name and value when "remove" is chosen', async () => {
    prompterMock.pick.mockResolvedValueOnce('remove');
    prompterMock.pick.mockResolvedValueOnce('testKey');
    prompterMock.pick.mockResolvedValueOnce('abort');

    await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName, testRecord, false);

    expect(prompterMock.pick).toHaveBeenCalledTimes(3);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(2, 'Which environment variable do you want to remove:', ['testKey']);
    const { message, choices } = getPrompterOperationalChoices(false, false);
    expect(prompterMock.pick).toHaveBeenNthCalledWith(3, message, choices, expect.anything());
  });

  it('updates environment variable record with new value when "remove" is chosen', async () => {
    prompterMock.pick.mockResolvedValueOnce('remove');
    prompterMock.pick.mockResolvedValueOnce('testKey');
    prompterMock.pick.mockResolvedValueOnce('abort');

    await envVarWalkthrough.askEnvironmentVariableQuestions(testResourceName, testRecord, false);

    const expectedValue = {} as Record<string, string>;
    expect(testRecord).toEqual(expectedValue);
  });

  const getPrompterOperationalChoices = (hasExistingEnvVars: boolean, isFirstLoop: boolean) => {
    const startingValue = isFirstLoop ? 0 : 3;
    return {
      message: 'Select what you want to do with environment variables:',
      choices: [
        {
          value: 'add',
          name: 'Add new environment variable',
        },
        {
          value: 'update',
          name: 'Update existing environment variables',
          disabled: !hasExistingEnvVars,
        },
        {
          value: 'remove',
          name: 'Remove existing environment variables',
          disabled: !hasExistingEnvVars,
        },
        {
          value: 'abort',
          name: "I'm done",
        },
      ],
      optionalParams: undefined,
    };
  };
});
