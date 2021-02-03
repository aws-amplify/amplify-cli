import { $TSContext, stateManager } from 'amplify-cli-core';
import _ = require('lodash');
import { MOCK_API_PORT } from '../../api/api';

/**
 * Loads all parameters that should be passed into the CFN template when resolving values
 *
 * Iterates through a list of parameter getters. If multiple getters return the same key, the latter will overwrite the former
 */
export const populateCfnParams = (
  print: $TSContext['print'],
  resourceName: string,
  overrideApiToLocal: boolean = false,
): Record<string, string> => {
  return [getDefaultParams, getAmplifyMetaParams, getParametersJsonParams, getTeamProviderParams]
    .map(paramProvider => paramProvider(print, resourceName, overrideApiToLocal))
    .reduce((acc, it) => ({ ...acc, ...it }), {});
};

const getDefaultParams = (): Record<string, string> => {
  const env = stateManager.getLocalEnvInfo().envName;
  const teamProvider = stateManager.getTeamProviderInfo();
  const region = _.get(teamProvider, [env, 'awscloudformation', 'Region']);
  const stackId = _.get(teamProvider, [env, 'awscloudformation', 'StackId'], '');
  const accountIdMatcher = /arn:aws:cloudformation:.+:(?<accountId>\d+):stack\/.+/;
  const match = accountIdMatcher.exec(stackId);
  const accountId = match ? match.groups.accountId : '12345678910';
  return {
    env,
    'AWS::Region': region,
    'AWS::AccountId': accountId,
    'AWS::StackId': 'fake-stackId',
    'AWS::StackName': 'local-testing',
  };
};

/**
 * Loads CFN parameters by matching the dependsOn field of the resource with the CFN outputs of other resources in the project
 */
const getAmplifyMetaParams = (
  print: $TSContext['print'],
  resourceName: string,
  overrideApiToLocal: boolean = false,
): Record<string, string> => {
  const projectMeta = stateManager.getMeta();
  if (!Array.isArray(projectMeta?.function?.[resourceName]?.dependsOn)) {
    return {};
  }
  const dependencies = projectMeta?.function?.[resourceName]?.dependsOn as {
    category: string;
    resourceName: string;
    attributes: string[];
  }[];
  return dependencies.reduce((acc, dependency) => {
    dependency.attributes.forEach(attribute => {
      let val = projectMeta?.[dependency.category]?.[dependency.resourceName]?.output?.[attribute];
      if (!val) {
        print.warning(
          `No output found for attribute '${attribute}' on resource '${dependency.resourceName}' in category '${dependency.category}'`,
        );
        print.warning('This attribute will be undefined in the mock environment until you run `amplify push`');
      }
      if (overrideApiToLocal && attribute === 'GraphQLAPIEndpointOutput') {
        val = `http://localhost:${MOCK_API_PORT}/graphql`;
      }
      acc[dependency.category + dependency.resourceName + attribute] = val;
    });
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Loads CFN parameters from the parameters.json file for the resource (if present)
 */
const getParametersJsonParams = (_, resourceName: string): Record<string, string> => {
  return stateManager.getResourceParametersJson(undefined, 'function', resourceName, { throwIfNotExist: false }) ?? {};
};

/**
 * Loads CFN parameters for the resource in the team-provider-info.json file (if present)
 */
const getTeamProviderParams = (__, resourceName: string): Record<string, string> => {
  const env = stateManager.getLocalEnvInfo().envName;
  return _.get(stateManager.getTeamProviderInfo(), [env, 'categories', 'function', resourceName], {});
};
