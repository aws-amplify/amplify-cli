import path from 'path';
import _ from 'lodash';
import * as uuid from 'uuid';
import inquirer from 'inquirer';
import { $TSContext, stateManager, pathManager, JSONUtilities, exitOnNextTick } from 'amplify-cli-core';
import { functionParametersFileName } from './constants';
import { categoryName } from '../../../constants';
import { formatter, maxLength, printer, prompter } from 'amplify-prompts';

export const validKey = new RegExp(/^[a-zA-Z0-9_]+$/);

export const getStoredEnvironmentVariables = (resourceName: string, currentEnvName?: string): Record<string, string> => {
  const storedList = getStoredList(resourceName);
  const storedReferences = getStoredReferences(resourceName);
  const storedParameters = getStoredParameters(resourceName);
  const storedKeyValue = getStoredKeyValue(resourceName, currentEnvName);
  const environmentVariables = {};

  // Search for key and take matched
  // environment variables based on 4 steps
  storedList.forEach(({ environmentVariableName, cloudFormationParameterName }) => {
    // 1. Check if format is correct in function-parameter.json
    if (!environmentVariableName) return;
    if (!cloudFormationParameterName) return;
    // 2. Check if key exists in CFn template
    if (!storedParameters[cloudFormationParameterName]) return;
    if (storedReferences[environmentVariableName]?.Ref !== cloudFormationParameterName) return;
    // 3. Check if key exists in team-provider-info.json
    if (!_.has(storedKeyValue, cloudFormationParameterName)) return;

    // 4. Take matched environment variables
    environmentVariables[environmentVariableName] = storedKeyValue[cloudFormationParameterName];
  });

  return environmentVariables;
};

export const saveEnvironmentVariables = (resourceName: string, newEnvironmentVariables: Record<string, string>) => {
  const currentEnvironmentVariables = getStoredEnvironmentVariables(resourceName);
  _.each(currentEnvironmentVariables, (_, key) => {
    deleteEnvironmentVariable(resourceName, key);
  });
  _.each(newEnvironmentVariables, (value, key) => {
    setEnvironmentVariable(resourceName, key, value);
  });
};

export const askEnvironmentVariableCarryOut = async (
  context: $TSContext,
  currentEnvName: string,
  projectPath: string,
  yesFlagSet?: boolean,
) => {
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath, {
    throwIfNotExist: false,
    default: {},
  });
  const functions = teamProviderInfo[currentEnvName]?.categories?.function || {};
  const functionNames = Object.keys(functions);
  if (functionNames.length === 0) {
    return;
  }

  const hasEnvVars = !!functionNames.find(funcName => !_.isEmpty(getStoredEnvironmentVariables(funcName, currentEnvName)));
  if (!hasEnvVars) {
    return;
  }

  const envVarQuestion = async () => {
    const envVarQuestion: inquirer.ListQuestion = {
      type: 'list',
      name: 'envVar',
      message: 'You have configured environment variables for functions. How do you want to proceed?',
      choices: [
        {
          value: 'carry',
          name: 'Carry over existing environment variables to this new environment',
        },
        {
          value: 'update',
          name: 'Update environment variables now',
        },
      ],
    };
    if (context.parameters.options.quickstart) return;
    const { envVar } = yesFlagSet ? { envVar: 'carry' } : await inquirer.prompt(envVarQuestion);
    if (envVar === 'carry') return;
    if (envVar === 'update') await envVarSelectFunction();
  };

  const envVarSelectFunction = async () => {
    const abortKey = uuid.v4();
    const functionNameQuestion: inquirer.ListQuestion = {
      type: 'list',
      name: 'functionName',
      message: 'Select the Lambda function you want to update values',
      choices: functionNames
        .map(name => ({
          name,
          value: name,
        }))
        .concat({
          name: "I'm done",
          value: abortKey,
        }),
    };
    const { functionName } = await inquirer.prompt(functionNameQuestion);
    if (functionName === abortKey) return;
    await envVarSelectKey(functionName);
  };

  const envVarSelectKey = async (functionName: string) => {
    const envVars = getStoredEnvironmentVariables(functionName, currentEnvName);
    const abortKey = uuid.v4();
    const keyNameQuestion: inquirer.ListQuestion = {
      type: 'list',
      name: 'keyName',
      message: 'Which function’s environment variables do you want to edit?',
      choices: Object.keys(envVars)
        .map(name => ({
          name,
          value: name,
        }))
        .concat({
          name: "I'm done",
          value: abortKey,
        }),
    };
    const { keyName } = await inquirer.prompt(keyNameQuestion);
    if (keyName === abortKey) {
      await envVarSelectFunction();
      return;
    }
    await envVarUpdateValue(functionName, keyName);
  };

  const envVarUpdateValue = async (functionName: string, keyName: string) => {
    const envVars = getStoredEnvironmentVariables(functionName, currentEnvName);
    const newValueQuestion: inquirer.InputQuestion = {
      type: 'input',
      name: 'newValue',
      message: 'Enter the environment variable value:',
      default: envVars[keyName],
      validate: input => {
        if (input.length >= 2048) {
          return 'The value must be 2048 characters or less';
        }
        return true;
      },
    };
    const { newValue } = await inquirer.prompt(newValueQuestion);
    functions[functionName][_.camelCase(keyName)] = newValue;
    await envVarSelectKey(functionName);
  };

  await envVarQuestion();
  Object.keys(functions).forEach(functionName => {
    setStoredKeyValue(functionName, functions[functionName]);
  });
};

export const ensureEnvironmentVariableValues = async (context: $TSContext) => {
  const yesFlagSet = context?.exeInfo?.inputParams?.yes || context?.input?.options?.yes;
  const currentEnvName = stateManager.getLocalEnvInfo()?.envName;
  const teamProviderInfo = stateManager.getTeamProviderInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  });
  const functions = teamProviderInfo[currentEnvName]?.categories?.function || {};
  const functionNames = Object.keys(functions);
  if (functionNames.length === 0) {
    return;
  }

  const functionConfigMissingEnvVars = functionNames
    .map(funcName => {
      const storedList = getStoredList(funcName);
      const keyValues = getStoredKeyValue(funcName);
      return {
        funcName,
        existingKeyValues: keyValues,
        missingEnvVars: storedList.filter(({ cloudFormationParameterName: keyName }) => !keyValues.hasOwnProperty(keyName)),
      };
    })
    .filter(envVars => envVars.missingEnvVars.length);

  if (_.isEmpty(functionConfigMissingEnvVars)) {
    return;
  }

  // there are some missing env vars

  if (yesFlagSet) {
    // in this case, we can't prompt for missing values, so fail gracefully
    const errMessage = `Cannot push Amplify environment "${currentEnvName}" due to missing Lambda function environment variable values. Rerun 'amplify push' without '--yes' to fix.`;
    printer.error(errMessage);
    const missingEnvVarsMessage = functionConfigMissingEnvVars.map(({ missingEnvVars, funcName }) => {
      const missingEnvVarsString = missingEnvVars.map(missing => missing.environmentVariableName).join(', ');
      return `Function ${funcName} is missing values for environment variables: ${missingEnvVarsString}`;
    });
    formatter.list(missingEnvVarsMessage);
    await context.usageData.emitError(new Error(errMessage));
    exitOnNextTick(1);
  }

  printer.info('Some Lambda function environment variables are missing values in this Amplify environment.');

  // prompt for the missing env vars
  for (const { funcName, existingKeyValues: keyValues, missingEnvVars } of functionConfigMissingEnvVars) {
    for (const { cloudFormationParameterName: cfnName, environmentVariableName: envVarName } of missingEnvVars) {
      const newValue = await prompter.input(`Enter the missing environment variable value of ${envVarName} in ${funcName}:`, {
        validate: maxLength(2048),
      });
      keyValues[cfnName] = newValue;
    }
    setStoredKeyValue(funcName, keyValues);
  }
};

const setEnvironmentVariable = (resourceName: string, newEnvironmentVariableKey: string, newEnvironmentVariableValue: string): void => {
  const newList = getStoredList(resourceName);
  const newReferences = getStoredReferences(resourceName);
  const newParameters = getStoredParameters(resourceName);
  const newKeyValue = getStoredKeyValue(resourceName);
  const cameledKey = _.camelCase(newEnvironmentVariableKey);
  newList.push({
    cloudFormationParameterName: cameledKey,
    environmentVariableName: newEnvironmentVariableKey,
  });
  newReferences[newEnvironmentVariableKey] = { Ref: cameledKey };
  newParameters[cameledKey] = { Type: 'String' };
  newKeyValue[cameledKey] = newEnvironmentVariableValue;

  setStoredList(resourceName, newList);
  setStoredReference(resourceName, newReferences);
  setStoredParameters(resourceName, newParameters);
  setStoredKeyValue(resourceName, newKeyValue);
};

const deleteEnvironmentVariable = (resourceName: string, targetedKey: string): void => {
  let newList = getStoredList(resourceName);
  const newReferences = getStoredReferences(resourceName);
  const newKeyValue = getStoredKeyValue(resourceName);
  const newParameters = getStoredParameters(resourceName);
  const cameledKey = _.camelCase(targetedKey);
  newList = _.filter(newList, item => {
    return item.cloudFormationParameterName !== cameledKey && item.environmentVariableName !== targetedKey;
  });
  _.unset(newReferences, targetedKey);
  _.unset(newParameters, cameledKey);
  _.unset(newKeyValue, cameledKey);

  setStoredList(resourceName, newList);
  setStoredReference(resourceName, newReferences);
  setStoredParameters(resourceName, newParameters);
  setStoredKeyValue(resourceName, newKeyValue);
};

const getStoredList = (resourceName: string): { cloudFormationParameterName: string; environmentVariableName: string }[] => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const resourcePath = path.join(projectBackendDirPath, categoryName, resourceName);
  const functionParameterFilePath = path.join(resourcePath, functionParametersFileName);
  const functionParameters = (JSONUtilities.readJson(functionParameterFilePath, { throwIfNotExist: false }) as object) || {};
  return _.get(functionParameters, 'environmentVariableList', []);
};

const setStoredList = (resourceName: string, newList: object): void => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const resourcePath = path.join(projectBackendDirPath, categoryName, resourceName);
  const functionParameterFilePath = path.join(resourcePath, functionParametersFileName);
  const functionParameters = (JSONUtilities.readJson(functionParameterFilePath, { throwIfNotExist: false }) as object) || {};
  _.set(functionParameters, 'environmentVariableList', newList);
  JSONUtilities.writeJson(functionParameterFilePath, functionParameters);
};

const getStoredReferences = (resourceName: string): object => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const resourcePath = path.join(projectBackendDirPath, categoryName, resourceName);
  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourcePath, cfnFileName);
  const cfnContent = JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) || {};
  return _.get(cfnContent, ['Resources', 'LambdaFunction', 'Properties', 'Environment', 'Variables'], {});
};

const setStoredReference = (resourceName: string, newReferences: object): void => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const resourcePath = path.join(projectBackendDirPath, categoryName, resourceName);
  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourcePath, cfnFileName);
  const cfnContent = (JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) as object) || {};
  _.set(cfnContent, ['Resources', 'LambdaFunction', 'Properties', 'Environment', 'Variables'], newReferences);
  JSONUtilities.writeJson(cfnFilePath, cfnContent);
};

const getStoredParameters = (resourceName: string): object => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const resourcePath = path.join(projectBackendDirPath, categoryName, resourceName);
  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourcePath, cfnFileName);
  const cfnContent = JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) || {};
  return _.get(cfnContent, ['Parameters'], {});
};

const setStoredParameters = (resourceName: string, newParameters: object): void => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const resourcePath = path.join(projectBackendDirPath, categoryName, resourceName);
  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourcePath, cfnFileName);
  const cfnContent = (JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) as object) || {};
  _.set(cfnContent, ['Parameters'], newParameters);
  JSONUtilities.writeJson(cfnFilePath, cfnContent);
};

const getStoredKeyValue = (resourceName: string, currentEnvName?: string): object => {
  const projectPath = pathManager.findProjectRoot();
  const envName = currentEnvName || stateManager.getLocalEnvInfo().envName;
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath, { throwIfNotExist: false });
  return _.get(teamProviderInfo, [envName, 'categories', categoryName, resourceName], {});
};

const setStoredKeyValue = (resourceName: string, newKeyValue: object): void => {
  const projectPath = pathManager.findProjectRoot();
  const envName = stateManager.getLocalEnvInfo().envName;
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath, { throwIfNotExist: false });
  _.set(teamProviderInfo, [envName, 'categories', categoryName, resourceName], newKeyValue);
  stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
};
