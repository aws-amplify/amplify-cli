import { JSONUtilities } from 'amplify-cli-core';
import _ from 'lodash';

export async function loadProjectLayers(context) {
  const { envName } = context.amplify.getEnvInfo();
  const teamProviderInfo = await JSONUtilities.readJson(context.amplify.pathManager.getProviderInfoFilePath());
  const projectLayers = _.get(teamProviderInfo, [envName, 'nonCFNdata', 'function'], null);

  if (!projectLayers) {
    throw new Error(`Failed to find Lambda layers in team-provider-info.json for the current environment: ${envName}.`);
  }

  return projectLayers;
}
