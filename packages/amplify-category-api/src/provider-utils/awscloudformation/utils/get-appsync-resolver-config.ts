import { AppsyncApiInputState } from '../api-input-manager/appsync-api-input-state';
import { conflictResolutionToResolverConfig } from './resolver-config-to-conflict-resolution-bi-di-mapper';

/**
 *
 * @param resourceName
 * @returns resolverConfig
 */
export const getResolverConfig = async (resourceName: string) => {
  const cliState = new AppsyncApiInputState(resourceName);
  const appsyncInputs = cliState.getCLIInputPayload().serviceConfiguration;
  return conflictResolutionToResolverConfig(appsyncInputs.conflictResolution);
};
