import * as path from 'path';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import { getBackendAmplifyMeta, getTeamProviderInfo } from 'amplify-e2e-core';
import { AuthProjectDetails, StorageProjectDetails } from '.';
import { DynamoDBProjectDetails } from './types';

export const getShortId = (): string => {
  const [shortId] = uuid().split('-');

  return shortId;
};

export const getAuthProjectDetails = (projectRoot: string): AuthProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const authMetaKey = Object.keys(meta.auth)
    .filter(key => meta.auth[key].service === 'Cognito')
    .map(key => key)[0];

  const authMeta = meta.auth[authMetaKey];
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
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
    .filter(key => meta.auth[key].service === 'Cognito')
    .map(key => key)[0];

  const authMeta = meta.auth[authMetaKey];
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
      OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
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
  const parameters = JSONUtilities.readJson(parametersFilePath);

  return parameters;
};

export const readRootStack = (projectRoot: string): $TSObject => {
  const rootStackFilePath = path.join(projectRoot, 'amplify', 'backend', 'awscloudformation', 'nested-cloudformation-stack.yml');
  const rootStack = JSONUtilities.readJson(rootStackFilePath);

  return rootStack;
};

export const getOGStorageProjectDetails = (projectRoot: string): StorageProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);

  const storageMetaKey = Object.keys(meta.storage)
    .filter(key => meta.storage[key].service === 'S3')
    .map(key => key)[0];

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
    .filter(key => meta.storage[key].service === 'S3')
    .map(key => key)[0];

  const stoargeMeta = meta.storage[storageMetaKey];
  const storageTeam = _.get(team, ['integtest', 'categories', 'storage', storageMetaKey]);
  const parameters = readResourceParametersJson(projectRoot, 'storage', storageMetaKey);

  const result: StorageProjectDetails = {
    storageResourceName: storageMetaKey,
    parameters: {
      resourceName: parameters.userPoolName,
    },
    meta: {
      BucketName: stoargeMeta.output.BucketName,
      Region: stoargeMeta.output.Region,
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
  const s3ResourceName = Object.keys(amplifyMeta.storage).find((key: any) => {
    return amplifyMeta.storage[key].service === 'S3';
  }) as any;
  return s3ResourceName;
};

export const getOGDynamoDBProjectDetails = (projectRoot: string): DynamoDBProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);

  const storageMetaKey = Object.keys(meta.storage)
    .filter(key => meta.storage[key].service === 'DynamoDB')
    .map(key => key)[0];

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
    .filter(key => meta.storage[key].service === 'DynamoDB')
    .map(key => key)[0];

  const dynamodbMeta = meta.storage[storageMetaKey];
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
  const dynamoDBResourceName = Object.keys(amplifyMeta.storage).find((key: any) => {
    return amplifyMeta.storage[key].service === 'DynamoDB';
  }) as any;
  return dynamoDBResourceName;
};
