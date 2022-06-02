import { $TSContext } from 'amplify-cli-core';
import { AppsyncApiInputState } from '../api-input-manager/appsync-api-input-state';
import { conflictResolutionToResolverConfig } from './resolver-config-to-conflict-resolution-bi-di-mapper';

/**
 *
 * @param resourceName
 * @returns resolverConfig
 */
export const getResolverConfig = async (context: $TSContext, resourceName: string) => {
  const cliState = new AppsyncApiInputState(context, resourceName);
  if (cliState.cliInputFileExists()) {
    const appsyncInputs = cliState.getCLIInputPayload().serviceConfiguration;
    return conflictResolutionToResolverConfig(appsyncInputs.conflictResolution);
  }
};
