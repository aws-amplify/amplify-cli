import inquirer from 'inquirer';
import _ from 'lodash';
import { validKey, getStoredEnvironmentVariables } from '../utils/environmentVariablesHelper';
import { getLocalFunctionSecretNames } from '../secrets/functionSecretsStateManager';

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
    environmentVariables = await getStoredEnvironmentVariables(resourceName);
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

const selectEnvironmentVariableQuestion = async (
  hasExistingEnvVars: boolean,
  firstLoop: boolean,
): Promise<'add' | 'update' | 'remove' | 'abort'> => {
  if (!hasExistingEnvVars && firstLoop) {
    return 'add';
  }
  const { operation } = await inquirer.prompt([
    {
      name: 'operation',
      message: 'Select what you want to do with environment variables:',
      type: 'list',
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
      default: firstLoop ? 'add' : 'abort',
    },
  ]);

  return operation;
};

const addEnvironmentVariableQuestion = async (
  environmentVariables: Record<string, string>,
  secretNames: string[],
): Promise<{ newEnvironmentVariableKey: string; newEnvironmentVariableValue: string }> => {
  const { newEnvironmentVariableKey, newEnvironmentVariableValue } = await inquirer.prompt([
    {
      name: 'newEnvironmentVariableKey',
      message: 'Enter the environment variable name:',
      type: 'input',
      validate: (input) => {
        if (!validKey.test(input)) {
          return 'You can use the following characters: a-z A-Z 0-9 _';
        }
        if (_.has(environmentVariables, input) || secretNames.includes(input)) {
          return `Key "${input}" is already used`;
        }
        return true;
      },
    },
    {
      name: 'newEnvironmentVariableValue',
      message: 'Enter the environment variable value:',
      type: 'input',
      validate: envVarValueValidator,
    },
  ]);
  return {
    newEnvironmentVariableKey,
    newEnvironmentVariableValue,
  };
};

const updateEnvironmentVariableQuestion = async (
  environmentVariables: Record<string, string>,
  secretNames: string[] = [],
): Promise<{ newEnvironmentVariableKey: string; newEnvironmentVariableValue: string; targetedKey: string }> => {
  const { targetedKey } = await inquirer.prompt([
    {
      name: 'targetedKey',
      message: 'Which environment variable do you want to update:',
      type: 'list',
      choices: Object.keys(environmentVariables),
    },
  ]);

  const { newEnvironmentVariableKey, newEnvironmentVariableValue } = await inquirer.prompt([
    {
      name: 'newEnvironmentVariableKey',
      message: 'Enter the environment variable name:',
      type: 'input',
      validate: (input) => {
        if (!validKey.test(input)) {
          return 'You can use the following characters: a-z A-Z 0-9 _';
        }
        if ((_.has(environmentVariables, input) && input !== targetedKey) || secretNames.includes(input)) {
          return `Key "${input}" is already used.`;
        }
        return true;
      },
      default: targetedKey,
    },
    {
      name: 'newEnvironmentVariableValue',
      message: 'Enter the environment variable value:',
      type: 'input',
      validate: envVarValueValidator,
      default: environmentVariables[targetedKey],
    },
  ]);

  return {
    newEnvironmentVariableKey,
    newEnvironmentVariableValue,
    targetedKey,
  };
};

const removeEnvironmentVariableQuestion = async (environmentVariables: Record<string, string>): Promise<string> => {
  const { targetedKey } = await inquirer.prompt([
    {
      name: 'targetedKey',
      message: 'Which environment variable do you want to remove:',
      type: 'list',
      choices: Object.keys(environmentVariables),
    },
  ]);

  return targetedKey;
};

const envVarValueValidator = (input: string): true | string => {
  if (input.length < 1 || input.length > 2048) {
    return 'The value must be between 1 and 2048 characters long';
  }
  return true;
};
