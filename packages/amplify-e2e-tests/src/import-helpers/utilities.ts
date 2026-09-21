import { $TSAny, $TSObject, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import {
  addAuthIdentityPoolAndUserPoolWithOAuth,
  addAuthUserPoolOnlyWithOAuth,
  amplifyPushAuth,
  createUserPoolOnlyWithOAuthSettings,
  getBackendAmplifyMeta,
  getProjectMeta,
  getTeamProviderInfo,
} from '@aws-amplify/amplify-e2e-core';
import {
  CognitoIdentityProviderClient,
  CreateUserPoolClientCommand,
  DeleteUserPoolClientCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { fromIni } from '@aws-sdk/credential-providers';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
// eslint-disable-next-line import/no-cycle
import { AuthProjectDetails, createIDPAndUserPoolWithOAuthSettings, StorageProjectDetails } from '.';
import { AppClientSettings, DynamoDBProjectDetails } from './types';

export const getShortId = (): string => {
  const [shortId] = uuid().split('-');

  return shortId;
};

export const getAuthProjectDetails = (projectRoot: string): AuthProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);
  const authMetaKey = Object.keys(meta.auth)
    .filter((key) => meta.auth[key].service === 'Cognito')
    .map((key) => key)[0];

  const authMeta = meta.auth[authMetaKey];
  // eslint-disable-next-line spellcheck/spell-checker
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
  // eslint-disable-next-line spellcheck/spell-checker
  const providerTeam = _.get(team, ['integtest', 'awscloudformation']);
  const parameters = readResourceParametersJson(projectRoot, 'auth', authMetaKey);

  const result: AuthProjectDetails = {
    authResourceName: authMetaKey,
    parameters: {
      authSelections: parameters.authSelections,
      resourceName: parameters.userPoolName,
    },
    meta: {
      UserPoolId: authMeta.output.UserPoolId,
      UserPoolName: authMeta.output.UserPoolName,
      AppClientID: authMeta.output.AppClientID,
      AppClientSecret: authMeta.output.AppClientSecret,
      AppClientIDWeb: authMeta.output.AppClientIDWeb,
      HostedUIDomain: authMeta.output.HostedUIDomain,
      HostedUICustomDomain: authMeta.output.HostedUICustomDomain,
      OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
    },
    team: {
      userPoolId: authTeam.userPoolId,
      userPoolName: authTeam.userPoolName,
      webClientId: authTeam.webClientId,
      nativeClientId: authTeam.nativeClientId,
      hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
    },
  };

  if (result.parameters.authSelections === 'identityPoolAndUserPool') {
    result.meta = {
      ...result.meta,
      IdentityPoolId: authMeta.output.IdentityPoolId,
      IdentityPoolName: authMeta.output.IdentityPoolName,
      AmazonWebClient: authMeta.output.AmazonWebClient,
      FacebookWebClient: authMeta.output.FacebookWebClient,
      GoogleWebClient: authMeta.output.GoogleWebClient,
    };

    result.team = {
      ...result.team,
      identityPoolId: authMeta.output.IdentityPoolId,
      identityPoolName: authMeta.output.IdentityPoolName,
      allowUnauthenticatedIdentities: parameters.allowUnauthenticatedIdentities,
      authRoleArn: providerTeam.AuthRoleArn,
      authRoleName: providerTeam.AuthRoleName,
      unauthRoleArn: providerTeam.UnauthRoleArn,
      unauthRoleName: providerTeam.UnauthRoleName,
      amazonAppId: authTeam.amazonAppId,
      facebookAppId: authTeam.facebookAppId,
      googleClientId: authTeam.googleClientId,
    };
  }

  return result;
};

export const getOGAuthProjectDetails = (projectRoot: string): AuthProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const authMetaKey = Object.keys(meta.auth)
    .filter((key) => meta.auth[key].service === 'Cognito')
    .map((key) => key)[0];

  const authMeta = meta.auth[authMetaKey];
  // eslint-disable-next-line spellcheck/spell-checker
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
  const parameters = readResourceParametersJson(projectRoot, 'auth', authMetaKey);

  return {
    authResourceName: authMetaKey,
    parameters: {
      authSelections: parameters.authSelections,
      resourceName: parameters.userPoolName,
    },
    meta: {
      UserPoolId: authMeta.output.UserPoolId,
      UserPoolName: authMeta.output.UserPoolName,
      AppClientID: authMeta.output.AppClientID,
      AppClientSecret: authMeta.output.AppClientSecret,
      AppClientIDWeb: authMeta.output.AppClientIDWeb,
      HostedUIDomain: authMeta.output.HostedUIDomain,
      HostedUICustomDomain: authMeta.output.HostedUICustomDomain,
      OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
      IdentityPoolId: authMeta.output.IdentityPoolId,
      IdentityPoolName: authMeta.output.IdentityPoolName,
    },
    team: {
      userPoolId: authMeta.output.UserPoolId,
      userPoolName: authMeta.output.UserPoolName,
      webClientId: authMeta.output.AppClientIDWeb,
      nativeClientId: authMeta.output.AppClientID,
      hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
    },
  };
};

export const readResourceParametersJson = (projectRoot: string, category: string, resourceName: string): $TSObject => {
  const parametersFilePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'parameters.json');
  const parametersFileBuildPath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', 'parameters.json');

  if (fs.existsSync(parametersFilePath)) {
    return JSONUtilities.readJson(parametersFilePath);
  }
  if (fs.existsSync(parametersFileBuildPath)) {
    return JSONUtilities.readJson(parametersFileBuildPath);
  }
  throw new Error("parameters.json doesn't exist");
};

export const readRootStack = (projectRoot: string): $TSObject => {
  const rootStackFilePath = path.join(projectRoot, 'amplify', 'backend', 'awscloudformation', 'build', 'root-cloudformation-stack.json');
  const rootStack = JSONUtilities.readJson(rootStackFilePath);

  return rootStack;
};

export const getOGStorageProjectDetails = (projectRoot: string): StorageProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);

  const storageMetaKey = Object.keys(meta.storage)
    .filter((key) => meta.storage[key].service === 'S3')
    .map((key) => key)[0];

  const storageMeta = meta.storage[storageMetaKey];
  const parameters = readResourceParametersJson(projectRoot, 'storage', storageMetaKey);

  return {
    storageResourceName: storageMetaKey,
    parameters: {
      resourceName: parameters.resourceName,
    },
    meta: {
      BucketName: storageMeta.output.BucketName,
      Region: storageMeta.output.Region,
    },
  };
};

export const getStorageProjectDetails = (projectRoot: string): StorageProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const storageMetaKey = Object.keys(meta.storage)
    .filter((key) => meta.storage[key].service === 'S3')
    .map((key) => key)[0];

  const storageMeta = meta.storage[storageMetaKey];
  // eslint-disable-next-line spellcheck/spell-checker
  const storageTeam = _.get(team, ['integtest', 'categories', 'storage', storageMetaKey]);
  const parameters = readResourceParametersJson(projectRoot, 'storage', storageMetaKey);

  const result: StorageProjectDetails = {
    storageResourceName: storageMetaKey,
    parameters: {
      resourceName: parameters.userPoolName,
    },
    meta: {
      BucketName: storageMeta.output.BucketName,
      Region: storageMeta.output.Region,
    },
    team: {
      bucketName: storageTeam.bucketName,
      region: storageTeam.region,
    },
  };

  return result;
};

export const getS3ResourceName = (projectRoot: string): string => {
  const amplifyMeta = getBackendAmplifyMeta(projectRoot);
  const s3ResourceName = Object.keys(amplifyMeta.storage).find((key: $TSAny) => amplifyMeta.storage[key].service === 'S3') as $TSAny;
  return s3ResourceName;
};

export const getOGDynamoDBProjectDetails = (projectRoot: string): DynamoDBProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);

  const storageMetaKey = Object.keys(meta.storage)
    .filter((key) => meta.storage[key].service === 'DynamoDB')
    .map((key) => key)[0];

  const storageMeta = meta.storage[storageMetaKey];
  const parameters = readResourceParametersJson(projectRoot, 'storage', storageMetaKey);

  return {
    storageResourceName: storageMetaKey,
    parameters: {
      resourceName: parameters.resourceName,
    },
    meta: {
      Name: storageMeta.output.Name,
      Region: storageMeta.output.Region,
      PartitionKeyName: storageMeta.output.PartitionKeyName,
      PartitionKeyType: storageMeta.output.PartitionKeyType,
      SortKeyName: storageMeta.output.SortKeyName,
      SortKeyType: storageMeta.output.SortKeyType,
      Arn: storageMeta.output.Arn,
      StreamArn: storageMeta.output.StreamArn,
    },
  };
};

export const getDynamoDBProjectDetails = (projectRoot: string): DynamoDBProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const storageMetaKey = Object.keys(meta.storage)
    .filter((key) => meta.storage[key].service === 'DynamoDB')
    .map((key) => key)[0];

  const dynamodbMeta = meta.storage[storageMetaKey];
  // eslint-disable-next-line spellcheck/spell-checker
  const storageTeam = _.get(team, ['integtest', 'categories', 'storage', storageMetaKey]);
  const parameters = readResourceParametersJson(projectRoot, 'storage', storageMetaKey);

  return {
    storageResourceName: storageMetaKey,
    parameters: {
      resourceName: parameters.resourceName,
    },
    meta: {
      Name: dynamodbMeta.output.Name,
      Region: dynamodbMeta.output.Region,
      PartitionKeyName: dynamodbMeta.output.PartitionKeyName,
      PartitionKeyType: dynamodbMeta.output.PartitionKeyType,
      SortKeyName: dynamodbMeta.output.SortKeyName,
      SortKeyType: dynamodbMeta.output.SortKeyType,
      Arn: dynamodbMeta.output.Arn,
      StreamArn: dynamodbMeta.output.StreamArn,
    },
    team: {
      tableName: storageTeam.tableName,
      region: storageTeam.region,
      partitionKeyName: storageTeam.partitionKeyName,
      partitionKeyType: storageTeam.partitionKeyType,
      sortKeyName: storageTeam.sortKeyName,
      sortKeyType: storageTeam.sortKeyType,
      arn: storageTeam.arn,
      streamArn: storageTeam.streamArn,
    },
  };
};

export const getDynamoDBResourceName = (projectRoot: string): string => {
  const amplifyMeta = getBackendAmplifyMeta(projectRoot);
  const dynamoDBResourceName = Object.keys(amplifyMeta.storage).find(
    (key: $TSAny) => amplifyMeta.storage[key].service === 'DynamoDB',
  ) as $TSAny;
  return dynamoDBResourceName;
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const addAppClient = async (
  profileName: string,
  projectRoot: string,
  clientName: string,
  generateSecret: boolean,
  settings: AppClientSettings,
) => {
  const projectDetails = getProjectMeta(projectRoot);
  const authDetails = getAuthProjectDetails(projectRoot);
  const creds = fromIni({ profile: profileName });

  const cognitoClient = new CognitoIdentityProviderClient({
    credentials: creds,
    region: projectDetails.providers.awscloudformation.Region,
  });
  const response = await cognitoClient.send(
    new CreateUserPoolClientCommand({
      ClientName: clientName,
      UserPoolId: authDetails.meta.UserPoolId,
      GenerateSecret: generateSecret,
      AllowedOAuthFlows: settings.allowedOAuthFlows,
      CallbackURLs: settings.callbackURLs,
      LogoutURLs: settings.logoutURLs,
      AllowedOAuthScopes: settings.allowedScopes,
      SupportedIdentityProviders: settings.supportedIdentityProviders,
      AllowedOAuthFlowsUserPoolClient: settings.allowedOAuthFlowsUserPoolClient,
    }),
  );
  // eslint-disable-next-line spellcheck/spell-checker
  return { appClientId: response.UserPoolClient.ClientId, appclientSecret: response.UserPoolClient.ClientSecret };
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const addAppClientWithSecret = async (profileName: string, projectRoot: string, clientName: string, settings: AppClientSettings) =>
  addAppClient(profileName, projectRoot, clientName, true, settings);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const addAppClientWithoutSecret = async (
  profileName: string,
  projectRoot: string,
  clientName: string,
  settings: AppClientSettings,
) => addAppClient(profileName, projectRoot, clientName, false, settings);

export const deleteAppClient = async (profileName: string, projectRoot: string, clientId: string): Promise<void> => {
  const authDetails = getAuthProjectDetails(projectRoot);
  const projectDetails = getProjectMeta(projectRoot);
  const creds = fromIni({ profile: profileName });

  const cognitoClient = new CognitoIdentityProviderClient({
    credentials: creds,
    region: projectDetails.providers.awscloudformation.Region,
  });
  await cognitoClient.send(new DeleteUserPoolClientCommand({ ClientId: clientId, UserPoolId: authDetails.meta.UserPoolId }));
};

/**
 * sets up a project with auth (UserPool only or UserPool & IdentityPool)
 */
export const setupOgProjectWithAuth = async (
  ogProjectRoot: string,
  ogProjectSettings: { name: string },
  withIdentityPool = false,
): Promise<AuthProjectDetails> => {
  const ogShortId = getShortId();

  if (withIdentityPool) {
    await addAuthIdentityPoolAndUserPoolWithOAuth(ogProjectRoot, createIDPAndUserPoolWithOAuthSettings(ogProjectSettings.name, ogShortId));
  } else {
    await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, createUserPoolOnlyWithOAuthSettings(ogProjectSettings.name, ogShortId));
  }
  await amplifyPushAuth(ogProjectRoot);

  return getOGAuthProjectDetails(ogProjectRoot);
};
