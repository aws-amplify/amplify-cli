import _ from 'lodash';
import { validKey, getStoredEnvironmentVariables } from '../utils/environmentVariablesHelper';
import { getLocalFunctionSecretNames } from '../secrets/functionSecretsStateManager';
import { prompter, byValue, maxLength } from 'amplify-prompts';

type Operation = 'add' | 'update' | 'remove' | 'abort';

/* eslint-disable no-param-reassign */
/**
 * Entry point to the env var walkthrough
 */
export const askEnvironmentVariableQuestions = async (
  resourceName: string,
  environmentVariables?: Record<string, string>,
  skipWalkthrough?: boolean,
): Promise<Record<string, unknown>> => {
  if (!environmentVariables) {
    environmentVariables = getStoredEnvironmentVariables(resourceName);
  }
  let firstLoop = true;
  for (
    let operation = skipWalkthrough ? 'abort' : await selectEnvironmentVariableQuestion(_.size(environmentVariables) > 0, firstLoop);
    operation !== 'abort';
    operation = await selectEnvironmentVariableQuestion(_.size(environmentVariables) > 0, firstLoop)
  ) {
    switch (operation) {
      case 'add': {
        const { newEnvironmentVariableKey, newEnvironmentVariableValue } = await addEnvironmentVariableQuestion(
          environmentVariables,
          getLocalFunctionSecretNames(resourceName),
        );
        environmentVariables[newEnvironmentVariableKey] = newEnvironmentVariableValue;
        break;
      }
      case 'update': {
        const { newEnvironmentVariableKey, newEnvironmentVariableValue, targetedKey } = await updateEnvironmentVariableQuestion(
          environmentVariables,
          getLocalFunctionSecretNames(resourceName),
        );
        delete environmentVariables[targetedKey];
        environmentVariables[newEnvironmentVariableKey] = newEnvironmentVariableValue;
        break;
      }
      case 'remove': {
        const targetedKey = await removeEnvironmentVariableQuestion(environmentVariables);
        delete environmentVariables[targetedKey];
        break;
      }
      default:
    }
    firstLoop = false;
  }
  return {
    environmentMap: Object.keys(environmentVariables).reduce(
      (acc, cur) => ({
        ...acc,
        [cur]: { Ref: _.camelCase(cur) },
      }),
      {},
    ),
    environmentVariables,
  };
};

const selectEnvironmentVariableQuestion = async (hasExistingEnvVars: boolean, firstLoop: boolean): Promise<Operation> => {
  if (!hasExistingEnvVars && firstLoop) {
    return 'add';
  }

  const choices = [
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
  ];
  const initialValue = firstLoop ? 'add' : 'abort';
  const response: Operation = (await prompter.pick('Select what you want to do with environment variables:', choices, {
    initial: byValue(initialValue),
  })) as Operation;

  return response;
};

const addEnvironmentVariableQuestion = async (
  environmentVariables: Record<string, string>,
  secretNames: string[],
): Promise<{ newEnvironmentVariableKey: string; newEnvironmentVariableValue: string }> => {
  const newEnvironmentVariableKey = await prompter.input('Enter the environment variable name:', {
    validate: (input: string) => {
      if (!validKey.test(input)) {
        return 'You can use the following characters: a-z A-Z 0-9 _';
      }
      if (_.has(environmentVariables, input) || secretNames.includes(input)) {
        return `Key "${input}" is already used`;
      }
      return true;
    },
  });
  const newEnvironmentVariableValue = await prompter.input('Enter the environment variable value:', {
    validate: maxLength(2048, 'The value must be 2048 characters or less'),
  });

  return {
    newEnvironmentVariableKey,
    newEnvironmentVariableValue,
  };
};

const updateEnvironmentVariableQuestion = async (
  environmentVariables: Record<string, string>,
  secretNames: string[] = [],
): Promise<{ newEnvironmentVariableKey: string; newEnvironmentVariableValue: string; targetedKey: string }> => {
  const targetedKey = await prompter.pick('Which environment variable do you want to update:', Object.keys(environmentVariables));

  const newEnvironmentVariableKey = await prompter.input('Enter the environment variable name:', {
    validate: input => {
      if (!validKey.test(input)) {
        return 'You can use the following characters: a-z A-Z 0-9 _';
      }
      if ((_.has(environmentVariables, input) && input !== targetedKey) || secretNames.includes(input)) {
        return `Key "${input}" is already used.`;
      }
      return true;
    },
    initial: targetedKey,
  });

  const newEnvironmentVariableValue = await prompter.input('Enter the environment variable value:', {
    validate: maxLength(2048, 'The value must be 2048 characters or less'),
    initial: environmentVariables[targetedKey],
  });

  return {
    newEnvironmentVariableKey,
    newEnvironmentVariableValue,
    targetedKey,
  };
};

const removeEnvironmentVariableQuestion = async (environmentVariables: Record<string, string>): Promise<string> => {
  const targetedKey = await prompter.pick('Which environment variable do you want to remove:', Object.keys(environmentVariables));

  return targetedKey;
};
