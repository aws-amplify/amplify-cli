import {
  AddAuthUserPoolOnlyNoOAuthSettings,
  AddAuthIdentityPoolAndUserPoolWithOAuthSettings,
  AddStorageSettings,
  AddDynamoDBSettings,
  createUserPoolOnlyWithOAuthSettings,
} from '@aws-amplify/amplify-e2e-core';

export const createNoOAuthSettings = (projectPrefix: string, shortId: string): AddAuthUserPoolOnlyNoOAuthSettings => {
  return {
    resourceName: `${projectPrefix}res${shortId}`,
    userPoolName: `${projectPrefix}up${shortId}`,
  };
};

export const createIDPAndUserPoolWithOAuthSettings = (
  projectPrefix: string,
  shortId: string,
): AddAuthIdentityPoolAndUserPoolWithOAuthSettings => {
  const settings = createUserPoolOnlyWithOAuthSettings(projectPrefix, shortId);

  return {
    ...settings,
    allowUnauthenticatedIdentities: true,
    identityPoolName: `${projectPrefix}oaidp${shortId}`,
    idpFacebookAppId: 'idpFacebookAppId',
    idpGoogleAppId: 'idpGoogleAppId',
    idpAmazonAppId: 'idpAmazonAppId',
    idpAppleAppId: 'idpAppleId',
  };
};

export const createStorageSettings = (projectPrefix: string, shortId: string): AddStorageSettings => {
  return {
    resourceName: `${projectPrefix}res${shortId}`,
    bucketName: `${projectPrefix}bkt${shortId}`,
  };
};

export const createDynamoDBSettings = (projectPrefix: string, shortId: string): AddDynamoDBSettings => {
  return {
    resourceName: `${projectPrefix}res${shortId}`,
    tableName: `${projectPrefix}tbl${shortId}`,
    gsiName: `${projectPrefix}gsi${shortId}`,
  };
};
