import { EnvironmentDoesNotExistError, exitOnNextTick, stateManager, $TSAny, $TSContext } from 'amplify-cli-core';
import { ResourceConstants } from 'graphql-transformer-common';
import { printer } from 'amplify-prompts';
import { readJsonFile } from './read-json-file';


export function searchablePushChecks(context: $TSContext): void {
  const currEnv = context.amplify.getEnvInfo().envName;
  const teamProviderInfoFilePath = context.amplify.pathManager.getProviderInfoFilePath();
  const teamProviderInfo = readJsonFile(teamProviderInfoFilePath);
  const apiCategory = teamProviderInfo[currEnv]?.categories?.api;
  const instanceType = apiCategory ? apiCategory[ResourceConstants.PARAMETERS.ElasticsearchInstanceType] : null;
  if (!instanceType || instanceType === 't2.small.elasticsearch') {
    printer.warn("Your instance type for OpenSearch is t2.small, you may experience performance issues or data loss. Consider reconfiguring with the instructions here https://docs.amplify.aws/cli/graphql-transformer/searchable/")
  }
}
