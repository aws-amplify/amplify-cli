import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { thumbnailgen } from './storage/thumbnailgen/resource';
import { addusertogroup } from './function/addusertogroup/resource';
import { removeuserfromgroup } from './function/removeuserfromgroup/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  thumbnailgen,
  addusertogroup,
  removeuserfromgroup,
});
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.usernameAttributes = ['email', 'phone_number'];
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
const userPool = backend.auth.resources.userPool;
userPool.addClient('NativeAppClient', {
  refreshTokenValidity: Duration.days(30),
  disableOAuth: true,
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  generateSecret: false,
});
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'mediavault40471086845d4f7baa5271e2a416b533c0af8-main';
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
];
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.thumbnailgen.resources.cfnResources.cfnFunction.functionName = `thumbnailgen-${branchName}`;
backend.thumbnailgen.addEnvironment(
  'STORAGE_MEDIAVAULT_BUCKETNAME',
  backend.storage.resources.bucket.bucketName
);
backend.addusertogroup.resources.cfnResources.cfnFunction.functionName = `addusertogroup-${branchName}`;
backend.addusertogroup.addEnvironment(
  'AUTH_MEDIAVAULT0EB2B25B_USERPOOLID',
  backend.auth.resources.userPool.userPoolId
);
backend.removeuserfromgroup.resources.cfnResources.cfnFunction.functionName = `removeuserfromgroup-${branchName}`;
backend.removeuserfromgroup.addEnvironment(
  'AUTH_MEDIAVAULT0EB2B25B_USERPOOLID',
  backend.auth.resources.userPool.userPoolId
);
