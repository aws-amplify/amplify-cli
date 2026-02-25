import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { S3Trigger22536b88 } from './storage/S3Trigger22536b88/resource';
import { lowstockproducts } from './function/lowstockproducts/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  S3Trigger22536b88,
  lowstockproducts,
});
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.usernameAttributes = ['email'];
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    temporaryPasswordValidityDays: 7,
  },
};
const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
cfnIdentityPool.allowUnauthenticatedIdentities = false;
const userPool = backend.auth.resources.userPool;
userPool.addClient('NativeAppClient', {
  refreshTokenValidity: Duration.days(30),
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  disableOAuth: true,
  generateSecret: false,
});
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'productcatalogd4ffc6fd926f4285b3a12edc8e7c883ef086b-main';
s3Bucket.bucketEncryption = {
  serverSideEncryptionConfiguration: [
    {
      serverSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
      bucketKeyEnabled: false,
    },
  ],
};
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
  {
    authenticationType: 'API_KEY',
  },
  {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      awsRegion: backend.auth.resources.userPool.stack.region,
      userPoolId: backend.auth.resources.userPool.userPoolId,
    },
  },
];
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.S3Trigger22536b88.resources.cfnResources.cfnFunction.functionName = `S3Trigger22536b88-${branchName}`;
backend.lowstockproducts.resources.cfnResources.cfnFunction.functionName = `lowstockproducts-${branchName}`;
backend.data.resources.graphqlApi.grantMutation(
  backend.S3Trigger22536b88.resources.lambda
);
backend.data.resources.graphqlApi.grantQuery(
  backend.lowstockproducts.resources.lambda
);
