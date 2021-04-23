import inquirer from 'inquirer';
import _ from 'lodash';
import { $TSContext } from 'amplify-cli-core';
import {
  validKey,
  getStoredEnvironmentVariables,
  setEnvironmentVariable,
  deleteEnvironmentVariable,
} from '../utils/environmentVariablesHelper';

export const askEnvironmentVariableQuestions = async (context: $TSContext, resourceName: string): Promise<object> => {
  const environmentVariables = getStoredEnvironmentVariables(context, resourceName);
  const operation = await selectEnvironmentVariableQuestion(environmentVariables);
  switch (operation) {
    case 'add': {
      const { newEnvironmentVariableKey, newEnvironmentVariableValue } = await addEnvironmentVariableQuestion(environmentVariables);
      setEnvironmentVariable(context, resourceName, newEnvironmentVariableKey, newEnvironmentVariableValue);
      return await askEnvironmentVariableQuestions(context, resourceName);
    }
    case 'update': {
      const { newEnvironmentVariableKey, newEnvironmentVariableValue, targetedKey } = await updateEnvironmentVariableQuestion(
        environmentVariables,
      );
      deleteEnvironmentVariable(context, resourceName, targetedKey);
      setEnvironmentVariable(context, resourceName, newEnvironmentVariableKey, newEnvironmentVariableValue);
      return await askEnvironmentVariableQuestions(context, resourceName);
    }
    case 'remove': {
      const targetedKey = await removeEnvironmentVariableQuestion(environmentVariables);
      deleteEnvironmentVariable(context, resourceName, targetedKey);
      return await askEnvironmentVariableQuestions(context, resourceName);
    }
    case 'abort':
    default:
      const updatedEnvironmentVariables = getStoredEnvironmentVariables(context, resourceName);
      return {
        environmentMap: Object.keys(updatedEnvironmentVariables).reduce(
          (acc, cur) => ({
            ...acc,
            [cur]: { Ref: _.camelCase(cur) },
          }),
          {},
        ),
      };
  }
};

const selectEnvironmentVariableQuestion = async (environmentVariables: object): Promise<'add' | 'update' | 'remove' | 'abort'> => {
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
          disabled: _.size(environmentVariables) === 0,
        },
        {
          value: 'remove',
          name: 'Remove existing environment variables',
          disabled: _.size(environmentVariables) === 0,
        },
        {
          value: 'abort',
          name: "I'm done",
        },
      ],
    },
  ]);

  return operation;
};

const addEnvironmentVariableQuestion = async (
  environmentVariables: object,
): Promise<{ newEnvironmentVariableKey: string; newEnvironmentVariableValue: string }> => {
  const { newEnvironmentVariableKey, newEnvironmentVariableValue } = await inquirer.prompt([
    {
      name: 'newEnvironmentVariableKey',
      message: 'Enter the environment variable name:',
      type: 'input',
      validate: input => {
        if (!validKey.test(input)) {
          return 'You can use the following characters: a-z A-Z 0-9 _';
        }
        if (_.has(environmentVariables, input)) {
          return `Key "${input}" is used already`;
        }
        return true;
      },
    },
    {
      name: 'newEnvironmentVariableValue',
      message: 'Enter the environment variable value:',
      type: 'input',
      validate: input => {
        if (input.length >= 2048) {
          return 'The value must be 2048 characters or less';
        }
        return true;
      },
    },
  ]);
  return {
    newEnvironmentVariableKey,
    newEnvironmentVariableValue,
  };
};

const updateEnvironmentVariableQuestion = async (
  environmentVariables: object,
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
      validate: input => {
        if (!validKey.test(input)) {
          return 'You can use the following characters: a-z A-Z 0-9 _';
        }
        if (_.has(environmentVariables, input) && input !== targetedKey) {
          return `Key "${input}" is used already`;
        }
        return true;
      },
      default: targetedKey,
    },
    {
      name: 'newEnvironmentVariableValue',
      message: 'Enter the environment variable value:',
      type: 'input',
      validate: input => {
        if (input.length >= 2048) {
          return 'The value must be 2048 characters or less';
        }
        return true;
      },
      default: environmentVariables[targetedKey],
    },
  ]);

  return {
    newEnvironmentVariableKey,
    newEnvironmentVariableValue,
    targetedKey,
  };
};

const removeEnvironmentVariableQuestion = async (environmentVariables: object): Promise<string> => {
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
