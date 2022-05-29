import { AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';

export const authUtils = context => ({
  authType() {
    if (context.requestAuthorizationMode === AmplifyAppSyncSimulatorAuthenticationType.API_KEY) {
      return 'API Key Authorization';
    } else if (context.requestAuthorizationMode === AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM) {
      return 'IAM Authorization';
    } else if (context.requestAuthorizationMode === AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS) {
      return 'User Pool Authorization';
    } else if (context.requestAuthorizationMode === AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT) {
      return 'Open ID Connect Authorization';
    }

    return 'API Key Authorization';
  },
});
