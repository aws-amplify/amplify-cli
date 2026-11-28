import { getProjectMeta, getBackendAmplifyMeta, getTeamProviderInfo, getBackendConfig } from '@aws-amplify/amplify-e2e-core';
import { AuthParameters } from '@aws-amplify/amplify-category-auth';
// eslint-disable-next-line import/no-cycle
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import { AuthProjectDetails, DynamoDBProjectDetails, readRootStack, StorageProjectDetails } from '.';
import { getAWSExports } from '../aws-exports/awsExports';

export const expectAuthProjectDetailsMatch = (projectDetails: AuthProjectDetails, ogProjectDetails: AuthProjectDetails): void => {
  expect(projectDetails.parameters.authSelections).toEqual(ogProjectDetails.parameters.authSelections);

  expect(projectDetails.meta.UserPoolId).toEqual(ogProjectDetails.meta.UserPoolId);
  expect(projectDetails.meta.AppClientID).toEqual(ogProjectDetails.meta.AppClientID);
  expect(projectDetails.meta.AppClientIDWeb).toEqual(ogProjectDetails.meta.AppClientIDWeb);
  expect(projectDetails.meta.HostedUIDomain).toEqual(ogProjectDetails.meta.HostedUIDomain);
  expect(projectDetails.meta.HostedUICustomDomain).toEqual(ogProjectDetails.meta.HostedUICustomDomain);

  if (projectDetails.meta.OAuthMetadata) {
    expect(ogProjectDetails.meta.OAuthMetadata).toBeDefined();

    expect(projectDetails.meta.OAuthMetadata.AllowedOAuthFlows).toEqual(ogProjectDetails.meta.OAuthMetadata.AllowedOAuthFlows);
    expect(projectDetails.meta.OAuthMetadata.AllowedOAuthScopes.sort()).toEqual(
      ogProjectDetails.meta.OAuthMetadata.AllowedOAuthScopes.sort(),
    );
    expect(projectDetails.meta.OAuthMetadata.CallbackURLs).toEqual(ogProjectDetails.meta.OAuthMetadata.CallbackURLs);
    expect(projectDetails.meta.OAuthMetadata.LogoutURLs).toEqual(ogProjectDetails.meta.OAuthMetadata.LogoutURLs);
  }

  expect(projectDetails.team.userPoolId).toEqual(ogProjectDetails.team.userPoolId);
  expect(projectDetails.team.webClientId).toEqual(ogProjectDetails.team.webClientId);
  expect(projectDetails.team.nativeClientId).toEqual(ogProjectDetails.team.nativeClientId);
};

export const expectLocalAndCloudMetaFilesMatching = (projectRoot: string): void => {
  const cloudMeta = getProjectMeta(projectRoot);
  const meta = getBackendAmplifyMeta(projectRoot);

  expect(cloudMeta).toMatchObject(meta);
};

export const expectAuthLocalAndOGMetaFilesOutputMatching = (projectRoot: string, ogProjectRoot: string): void => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const ogMeta = getBackendAmplifyMeta(ogProjectRoot);

  const authMeta = Object.keys(meta.auth)
    .filter((key) => meta.auth[key].service === 'Cognito')
    .map((key) => meta.auth[key])[0];

  const ogAuthMeta = Object.keys(ogMeta.auth)
    .filter((key) => ogMeta.auth[key].service === 'Cognito')
    .map((key) => ogMeta.auth[key])[0];

  expect(authMeta.output.AppClientID).toEqual(ogAuthMeta.output.AppClientID);
  expect(authMeta.output.AppClientIDWeb).toEqual(ogAuthMeta.output.AppClientIDWeb);
  expect(authMeta.output.HostedUIDomain).toEqual(ogAuthMeta.output.HostedUIDomain);
  expect(authMeta.output.HostedUICustomDomain).toEqual(ogAuthMeta.output.HostedUICustomDomain);
  expect(authMeta.output.UserPoolId).toEqual(ogAuthMeta.output.UserPoolId);
};

export const expectNoAuthInMeta = (projectRoot: string): void => {
  const meta = getBackendAmplifyMeta(projectRoot);

  expect(meta.auth).toBeDefined();
  expect(meta.auth).toMatchObject({});
};

export const expectLocalTeamInfoHasNoCategories = (projectRoot: string): void => {
  const team = getTeamProviderInfo(projectRoot);

  // eslint-disable-next-line spellcheck/spell-checker
  expect(team.integtest.categories).toBeUndefined();
};

// eslint-disable-next-line @typescript-eslint/no-shadow
export const expectApiHasCorrectAuthConfig = (projectRoot: string, __: string, userPoolId: string): void => {
  const meta = getBackendAmplifyMeta(projectRoot);

  // eslint-disable-next-line spellcheck/spell-checker
  const authConfig = meta.api?.auimpup?.output?.authConfig;

  expect(authConfig).toBeDefined();

  expect(authConfig.defaultAuthentication?.authenticationType).toEqual('AMAZON_COGNITO_USER_POOLS');
  expect(authConfig.defaultAuthentication?.userPoolConfig?.userPoolId).toEqual(userPoolId);

  const rootStack = readRootStack(projectRoot);

  // eslint-disable-next-line spellcheck/spell-checker
  expect(rootStack.Resources?.apiauimpup?.Properties?.Parameters?.AuthCognitoUserPoolId).toEqual(userPoolId);
};

export const expectLocalAndPulledBackendConfigMatching = (projectRoot: string, projectRootPull: string): void => {
  const backendConfig = getBackendConfig(projectRoot);
  const backendConfigPull = getBackendConfig(projectRootPull);

  expect(backendConfig).toMatchObject(backendConfigPull);
};

export const expectLocalAndPulledBackendAmplifyMetaMatching = (projectRoot: string, projectRootPull: string): void => {
  const amplifyMeta = deepRemoveObjectKey(getBackendAmplifyMeta(projectRoot), 'lastPushTimeStamp');
  const amplifyMetaPull = deepRemoveObjectKey(getBackendAmplifyMeta(projectRootPull), 'lastPushTimeStamp');

  expect(amplifyMeta).toMatchObject(amplifyMetaPull);
};

export const expectLocalAndPulledAwsExportsMatching = (projectRoot: string, projectRootPull: string): void => {
  const awsExports = getAWSExports(projectRoot);
  const awsExportsPull = getAWSExports(projectRootPull);

  expect(awsExports).toMatchObject(awsExportsPull);
};

export const expectStorageProjectDetailsMatch = (projectDetails: StorageProjectDetails, ogProjectDetails: StorageProjectDetails): void => {
  expect(projectDetails.parameters.resourceName).toEqual(ogProjectDetails.parameters.resourceName);

  expect(projectDetails.meta.BucketName).toEqual(ogProjectDetails.meta.BucketName);
  expect(projectDetails.meta.Region).toEqual(ogProjectDetails.meta.Region);

  expect(projectDetails.team.bucketName).toEqual(ogProjectDetails.meta.BucketName);
  expect(projectDetails.team.region).toEqual(ogProjectDetails.meta.Region);
};

export const expectNoStorageInMeta = (projectRoot: string): void => {
  const meta = getBackendAmplifyMeta(projectRoot);

  expect(meta.storage).toBeDefined();
  expect(meta.storage).toMatchObject({});
};

export const expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage = (projectRoot: string): void => {
  const team = getTeamProviderInfo(projectRoot);

  /* eslint-disable spellcheck/spell-checker */
  expect(team.integtest.categories).toBeDefined();
  expect(team.integtest.categories.auth).toBeDefined();
  expect(team.integtest.categories.storage).toBeUndefined();
  /* eslint-enable spellcheck/spell-checker */
};

export const expectS3LocalAndOGMetaFilesOutputMatching = (projectRoot: string, ogProjectRoot: string): void => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const ogMeta = getBackendAmplifyMeta(ogProjectRoot);

  const storageMeta = Object.keys(meta.storage)
    .filter((key) => meta.storage[key].service === 'S3')
    .map((key) => meta.storage[key])[0];

  const ogStorageMeta = Object.keys(ogMeta.storage)
    .filter((key) => ogMeta.storage[key].service === 'S3')
    .map((key) => ogMeta.storage[key])[0];

  expect(storageMeta.output.BucketName).toEqual(ogStorageMeta.output.BucketName);
  expect(storageMeta.output.Region).toEqual(ogStorageMeta.output.Region);
};

export const expectDynamoDBProjectDetailsMatch = (
  projectDetails: DynamoDBProjectDetails,
  ogProjectDetails: DynamoDBProjectDetails,
): void => {
  expect(projectDetails.meta.Name).toEqual(ogProjectDetails.meta.Name);
  expect(projectDetails.meta.Region).toEqual(ogProjectDetails.meta.Region);
  expect(projectDetails.meta.PartitionKeyName).toEqual(ogProjectDetails.meta.PartitionKeyName);
  expect(projectDetails.meta.PartitionKeyType).toEqual(ogProjectDetails.meta.PartitionKeyType);
  expect(projectDetails.meta.SortKeyName).toEqual(ogProjectDetails.meta.SortKeyName);
  expect(projectDetails.meta.SortKeyType).toEqual(ogProjectDetails.meta.SortKeyType);
  expect(projectDetails.meta.Arn).toEqual(ogProjectDetails.meta.Arn);
  expect(projectDetails.meta.StreamArn).toEqual(ogProjectDetails.meta.StreamArn);

  expect(projectDetails.team.tableName).toEqual(ogProjectDetails.meta.Name);
  expect(projectDetails.team.region).toEqual(ogProjectDetails.meta.Region);
  expect(projectDetails.team.partitionKeyName).toEqual(ogProjectDetails.meta.PartitionKeyName);
  expect(projectDetails.team.partitionKeyType).toEqual(ogProjectDetails.meta.PartitionKeyType);
  expect(projectDetails.team.sortKeyName).toEqual(ogProjectDetails.meta.SortKeyName);
  expect(projectDetails.team.sortKeyType).toEqual(ogProjectDetails.meta.SortKeyType);
  expect(projectDetails.team.arn).toEqual(ogProjectDetails.meta.Arn);
  expect(projectDetails.team.streamArn).toEqual(ogProjectDetails.meta.StreamArn);
};

export const expectDynamoDBLocalAndOGMetaFilesOutputMatching = (projectRoot: string, ogProjectRoot: string): void => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const ogMeta = getBackendAmplifyMeta(ogProjectRoot);

  const storageMeta = Object.keys(meta.storage)
    .filter((key) => meta.storage[key].service === 'DynamoDB')
    .map((key) => meta.storage[key])[0];

  const ogStorageMeta = Object.keys(ogMeta.storage)
    .filter((key) => ogMeta.storage[key].service === 'DynamoDB')
    .map((key) => ogMeta.storage[key])[0];

  expect(storageMeta.output.Name).toEqual(ogStorageMeta.output.Name);
  expect(storageMeta.output.Region).toEqual(ogStorageMeta.output.Region);
  expect(storageMeta.output.PartitionKeyName).toEqual(ogStorageMeta.output.PartitionKeyName);
  expect(storageMeta.output.PartitionKeyType).toEqual(ogStorageMeta.output.PartitionKeyType);
  expect(storageMeta.output.SortKeyName).toEqual(ogStorageMeta.output.SortKeyName);
  expect(storageMeta.output.SortKeyType).toEqual(ogStorageMeta.output.SortKeyType);
  expect(storageMeta.output.Arn).toEqual(ogStorageMeta.output.Arn);
  expect(storageMeta.output.StreamArn).toEqual(ogStorageMeta.output.StreamArn);
};

export const expectAuthParametersMatch = (authParameters: AuthParameters, ogAuthParameters: AuthParameters): void => {
  expect(authParameters.authProvidersUserPool).toEqual(ogAuthParameters.authProvidersUserPool);
  expect(authParameters.requiredAttributes).toEqual(ogAuthParameters.requiredAttributes);
  expect(authParameters.passwordPolicyMinLength).toEqual(ogAuthParameters.passwordPolicyMinLength);
  expect(authParameters.passwordPolicyCharacters).toEqual(ogAuthParameters.passwordPolicyCharacters);
  expect(authParameters.mfaConfiguration).toEqual(ogAuthParameters.mfaConfiguration);
  expect(authParameters.autoVerifiedAttributes).toEqual(ogAuthParameters.autoVerifiedAttributes);
};

const deepRemoveObjectKey = (obj: $TSAny, key: string): $TSAny => {
  Object.keys(obj).forEach((objKey) => {
    if (typeof obj[objKey] === 'object') {
      // eslint-disable-next-line no-param-reassign
      obj[objKey] = deepRemoveObjectKey(obj[objKey], key);
    } else if (objKey === key) {
      // eslint-disable-next-line no-param-reassign
      delete obj[objKey];
    }
  });

  return obj;
};
