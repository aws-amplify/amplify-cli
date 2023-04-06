import { getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
// eslint-disable-next-line import/no-cycle
import { GRAPHQL_API_ENDPOINT_OUTPUT, GRAPHQL_API_KEY_OUTPUT, MOCK_API_KEY, MOCK_API_PORT } from '../../api/api';

/**
 * Loads all parameters that should be passed into the lambda CFN template when resolving values
 *
 * Iterates through a list of parameter getters. If multiple getters return the same key, the latter will overwrite the former
 */
export const populateCfnParams = (resourceName: string, overrideApiToLocal = false): Record<string, string> =>
  [getCfnPseudoParams, getAmplifyMetaParams, getParametersJsonParams, getResourceEnvParams]
    .map((paramProvider) => paramProvider(resourceName, overrideApiToLocal))
    .reduce((acc, it) => ({ ...acc, ...it }), {});

const getCfnPseudoParams = (): Record<string, string> => {
  const env = stateManager.getLocalEnvInfo().envName;
  const providerMeta = stateManager.getMeta()?.providers?.awscloudformation;

  const region = providerMeta?.Region || 'us-test-1';
  const stackId = providerMeta?.StackId || 'fake-stack-id';
  const stackName = providerMeta?.StackName || 'local-testing';

  const accountIdMatcher = /arn:aws:cloudformation:.+:(?<accountId>\d+):stack\/.+/;
  const match = accountIdMatcher.exec(stackId);
  const accountId = match ? match.groups.accountId : '12345678910';
  return {
    env,
    'AWS::Region': region,
    'AWS::AccountId': accountId,
    'AWS::StackId': stackId,
    'AWS::StackName': stackName,
    'AWS::URLSuffix': 'amazonaws.com',
  };
};

/**
 * Loads CFN parameters by matching the dependsOn field of the resource with the CFN outputs of other resources in the project
 */
const getAmplifyMetaParams = (resourceName: string, overrideApiToLocal = false): Record<string, string> => {
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
    dependency.attributes.forEach((attribute) => {
      let val = projectMeta?.[dependency.category]?.[dependency.resourceName]?.output?.[attribute];

      if (overrideApiToLocal) {
        switch (attribute) {
          case GRAPHQL_API_ENDPOINT_OUTPUT:
            val = `http://localhost:${MOCK_API_PORT}/graphql`;
            break;
          case GRAPHQL_API_KEY_OUTPUT:
            val = MOCK_API_KEY;
            break;
          default:
          // noop
        }
      }

      if (!val) {
        printer.warn(
          `No output found for attribute '${attribute}' on resource '${dependency.resourceName}' in category '${dependency.category}'`,
        );
        printer.warn('This attribute will be undefined in the mock environment until you run `amplify push`');
      }

      acc[dependency.category + dependency.resourceName + attribute] = val;
    });
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Loads CFN parameters from the parameters.json file for the resource (if present)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getParametersJsonParams = (resourceName: string): Record<string, string> =>
  stateManager.getResourceParametersJson(undefined, 'function', resourceName, { throwIfNotExist: false }) ?? {};

/**
 * Loads CFN parameters for the resource in the team-provider-info.json file (if present)
 */
const getResourceEnvParams = (resourceName: string): Record<string, string> =>
  getEnvParamManager().getResourceParamManager('function', resourceName).getAllParams();
