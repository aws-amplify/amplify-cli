import { $TSContext } from 'amplify-cli-core';
import { AppsyncApiInputState } from '../api-input-manager/appsync-api-input-state';
import { appSyncAuthTypeToAuthConfig } from './auth-config-to-app-sync-auth-type-bi-di-mapper';

/**
 *
 * @param resourceName
 * @returns authConfig
 */
export const getAuthConfig = async (context: $TSContext, resourceName: string) => {
  const cliState = new AppsyncApiInputState(context, resourceName);
  if (cliState.cliInputFileExists()) {
    const appsyncInputs = cliState.getCLIInputPayload().serviceConfiguration;
    return {
      defaultAuthentication: appSyncAuthTypeToAuthConfig(appsyncInputs.defaultAuthType),
      additionalAuthenticationProviders: (appsyncInputs.additionalAuthTypes || []).map(appSyncAuthTypeToAuthConfig),
    };
  }
};
