import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { S3Trigger1ef46783 } from './storage/S3Trigger1ef46783/resource';
import { lowstockproducts } from './function/lowstockproducts/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  S3Trigger1ef46783,
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
// s3Bucket.bucketName = 'productcatalogf95af07481f845caa6594c26ac9c8ed331323-main';
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
      userPoolId: backend.auth.resources.userPool.userPoolId,
    },
  },
];
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.S3Trigger1ef46783.resources.cfnResources.cfnFunction.functionName = `S3Trigger1ef46783-${branchName}`;
backend.S3Trigger1ef46783.addEnvironment(
  'API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT',
  backend.data.apiKey!
);
backend.S3Trigger1ef46783.addEnvironment(
  'API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT',
  backend.data.graphqlUrl
);
backend.S3Trigger1ef46783.addEnvironment(
  'API_PRODUCTCATALOG_GRAPHQLAPIIDOUTPUT',
  backend.data.apiId
);
backend.lowstockproducts.resources.cfnResources.cfnFunction.functionName = `lowstockproducts-${branchName}`;
backend.lowstockproducts.addEnvironment(
  'API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT',
  backend.data.apiKey!
);
backend.lowstockproducts.addEnvironment(
  'API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT',
  backend.data.graphqlUrl
);
backend.lowstockproducts.addEnvironment(
  'API_PRODUCTCATALOG_GRAPHQLAPIIDOUTPUT',
  backend.data.apiId
);
backend.data.resources.graphqlApi.grantMutation(
  backend.S3Trigger1ef46783.resources.lambda
);
backend.data.resources.graphqlApi.grantQuery(
  backend.lowstockproducts.resources.lambda
);
