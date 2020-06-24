import { AddApiRequest } from 'amplify-headless-interface';
import _ from 'lodash';
import { resolverConfigToConflictResolution } from './resolverConfigToConflictResolutionBiDiMapper';
import { authConfigToAppSyncAuthType } from './authConfigToAppSyncAuthTypeBiDiMapper';

// Temporary conversion function between the existing output of the appSync service walkthrough and the new AddApiRequest interface
// Long-term, the service walkthrough should be refactored to directly return an object conforming to the interface
export const serviceWalkthroughResultToAddApiRequest = (result): AddApiRequest => ({
  version: 1,
  serviceConfiguration: {
    serviceName: 'AppSync',
    apiName: result.answers.apiName,
    transformSchema: result.schemaContent,
    defaultAuthType: authConfigToAppSyncAuthType(result.output.authConfig.defaultAuthentication),
    additionalAuthTypes: (result.output.authConfig.additionalAuthenticationProviders || []).map(authConfigToAppSyncAuthType),
    conflictResolution: resolverConfigToConflictResolution(result.resolverConfig),
  },
});
