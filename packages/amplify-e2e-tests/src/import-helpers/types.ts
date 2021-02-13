import {
  BooleanType,
  CallbackURLsListType,
  OAuthFlowsType,
  ScopeListType,
  SupportedIdentityProvidersListType,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';

import { $TSObject } from 'amplify-cli-core';

export type AuthProjectDetails = {
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
    IdentityPoolId?: string;
    IdentityPoolName?: string;
    AmazonWebClient?: string;
    FacebookWebClient?: string;
    GoogleWebClient?: string;
  };
  team?: {
    userPoolId?: string;
    userPoolName?: string;
    webClientId?: string;
    nativeClientId?: string;
    hostedUIProviderCreds?: $TSObject;
    identityPoolId?: string;
    identityPoolName?: string;
    allowUnauthenticatedIdentities?: string;
    authRoleArn?: string;
    authRoleName?: string;
    unauthRoleArn?: string;
    unauthRoleName?: string;
    amazonAppId?: string;
    facebookAppId?: string;
    googleClientId?: string;
  };
};

export type StorageProjectDetails = {
  storageResourceName?: string;
  parameters?: {
    resourceName?: string;
  };
  meta?: {
    BucketName?: string;
    Region?: string;
  };
  team?: {
    tableName?: string;
    bucketName?: string;
    region?: string;
  };
};

export type DynamoDBProjectDetails = {
  storageResourceName?: string;
  parameters?: {
    resourceName?: string;
  };
  meta?: {
    Name?: string;
    Region?: string;
    PartitionKeyName?: string;
    PartitionKeyType?: string;
    SortKeyName?: string;
    SortKeyType?: string;
    Arn?: string;
    StreamArn?: string;
  };
  team?: {
    tableName?: string;
    region?: string;
    partitionKeyName?: string;
    partitionKeyType?: string;
    sortKeyName?: string;
    sortKeyType?: string;
    arn?: string;
    streamArn?: string;
  };
};

export type AppClientSettings = {
  allowedOAuthFlows?: OAuthFlowsType;
  callbackURLs?: CallbackURLsListType;
  logoutURLs?: CallbackURLsListType;
  allowedScopes?: ScopeListType;
  supportedIdentityProviders?: SupportedIdentityProvidersListType;
  allowedOAuthFlowsUserPoolClient?: BooleanType;
};
