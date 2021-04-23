import path from 'path';
import _ from 'lodash';
import { $TSContext, stateManager, pathManager, JSONUtilities } from 'amplify-cli-core';
import { categoryName, functionParametersFileName } from './constants';

export const validKey = new RegExp(/^[a-zA-Z0-9_]+$/);

export const getStoredEnvironmentVariables = (context: $TSContext, resourceName: string): object => {
  const storedList = getStoredList(resourceName);
  const storedReferences = getStoredReferences(resourceName);
  const storedKeyValue = getStoredKeyValue(context, resourceName);
  const environmentVariables = {};

  // Search for key and take matched
  // environment variables based on 4 steps
  storedList.forEach(({ environmentVariableName, cloudFormationParameterName }) => {
    // 1. Check if format is correct in function-parameter.json
    if (!environmentVariableName) return;
    if (!cloudFormationParameterName) return;
    // 2. Check if key exists in CFn template
    if (storedReferences[environmentVariableName]?.Ref !== cloudFormationParameterName) return;
    // 3. Check if key exists in team-provider-info.json
    if (!_.has(storedKeyValue, cloudFormationParameterName)) return;

    // 4. Take matched environment variables
    environmentVariables[environmentVariableName] = storedKeyValue[cloudFormationParameterName];
  });

  return environmentVariables;
};

export const setEnvironmentVariable = (
  context: $TSContext,
  resourceName: string,
  newEnvironmentVariableKey: string,
  newEnvironmentVariableValue: string,
): void => {
  const newList = getStoredList(resourceName);
  const newReferences = getStoredReferences(resourceName);
  const newKeyValue = getStoredKeyValue(context, resourceName);
  const cameledKey = _.camelCase(newEnvironmentVariableKey);
  newList.push({
    cloudFormationParameterName: cameledKey,
    environmentVariableName: newEnvironmentVariableKey,
  });
  newReferences[newEnvironmentVariableKey] = { Ref: cameledKey };
  newKeyValue[cameledKey] = newEnvironmentVariableValue;

  setStoredList(resourceName, newList);
  setFunctionEnvVarReference(resourceName, newReferences);
  setStoredKeyValue(context, resourceName, newKeyValue);
};

export const deleteEnvironmentVariable = (context: $TSContext, resourceName: string, targetedKey: string): void => {
  let newList = getStoredList(resourceName);
  const newReferences = getStoredReferences(resourceName);
  const newKeyValue = getStoredKeyValue(context, resourceName);
  const cameledKey = _.camelCase(targetedKey);
  newList = _.filter(newList, item => {
    return item.cloudFormationParameterName !== cameledKey && item.environmentVariableName !== targetedKey;
  });
  _.unset(newReferences, targetedKey);
  _.unset(newKeyValue, cameledKey);

  setStoredList(resourceName, newList);
  setFunctionEnvVarReference(resourceName, newReferences);
  setStoredKeyValue(context, resourceName, newKeyValue);
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

const setFunctionEnvVarReference = (resourceName: string, newReferences: object): void => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const resourcePath = path.join(projectBackendDirPath, categoryName, resourceName);
  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourcePath, cfnFileName);
  const cfnContent = (JSONUtilities.readJson(cfnFilePath, { throwIfNotExist: false }) as object) || {};
  _.set(cfnContent, ['Resources', 'LambdaFunction', 'Properties', 'Environment', 'Variables'], newReferences);
  JSONUtilities.writeJson(cfnFilePath, cfnContent);
};

const getStoredKeyValue = (context: $TSContext, resourceName: string): object => {
  const projectPath = pathManager.findProjectRoot();
  const { envName } = context.amplify.getEnvInfo();
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath, { throwIfNotExist: false });
  return _.get(teamProviderInfo, [envName, 'categories', categoryName, resourceName], {});
};

const setStoredKeyValue = (context: $TSContext, resourceName: string, newKeyValue: object): void => {
  const projectPath = pathManager.findProjectRoot();
  const { envName } = context.amplify.getEnvInfo();
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath, { throwIfNotExist: false });
  _.set(teamProviderInfo, [envName, 'categories', categoryName, resourceName], newKeyValue);
  stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
};
