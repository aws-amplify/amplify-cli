import { $TSObject } from 'amplify-cli-core';

export type ProjectDetails = {
  authResourceName?: string;
  parameters?: {
    authSelections?: string;
    resourceName?: string;
    serviceType?: string;
  };
  meta?: {
    UserPoolId?: string;
    UserPoolName?: string;
    AppClientID?: string;
    AppClientSecret?: string;
    AppClientIDWeb?: string;
    HostedUIDomain?: string;
    OAuthMetadata?: $TSObject;
  };
  team?: {
    userPoolId?: string;
    userPoolName?: string;
    webClientId?: string;
    nativeClientId?: string;
    hostedUIProviderCreds?: $TSObject;
  };
};
