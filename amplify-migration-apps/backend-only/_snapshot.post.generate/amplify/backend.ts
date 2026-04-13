import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { quotegeneratorbe } from './function/quotegeneratorbe/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Duration, CfnResource, RemovalPolicy } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  quotegeneratorbe,
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
const userPool = backend.auth.resources.userPool;
userPool.addClient('NativeAppClient', {
  refreshTokenValidity: Duration.days(30),
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  disableOAuth: true,
  generateSecret: false,
});
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
  {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      userPoolId: backend.auth.resources.userPool.userPoolId,
      awsRegion: backend.auth.stack.region,
    },
  },
];
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'backendonlycb1a13ab81664ecaa7d015068ab2d0165e0fa-main';
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
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.quotegeneratorbe.resources.cfnResources.cfnFunction.functionName = `quotegeneratorbe-${branchName}`;
for (const cfnResource of backend.auth.stack.node
  .findAll()
  .filter((n) => CfnResource.isCfnResource(n))) {
  if (
    [
      'AWS::Cognito::UserPool',
      'AWS::Cognito::IdentityPool',
      'AWS::Cognito::UserPoolClient',
      'AWS::Cognito::IdentityPoolRoleAttachment',
      'AWS::Cognito::UserPoolDomain',
      'AWS::Cognito::UserPoolGroup',
    ].includes(cfnResource.cfnResourceType)
  ) {
    cfnResource.addOverride('DeletionPolicy', 'Retain');
    cfnResource.addOverride('UpdateReplacePolicy', 'Retain');
  }
}
for (const cfnResource of backend.storage.stack.node
  .findAll()
  .filter((n) => CfnResource.isCfnResource(n))) {
  if (cfnResource.cfnResourceType === 'AWS::S3::Bucket') {
    cfnResource.addOverride('DeletionPolicy', 'Retain');
    cfnResource.addOverride('UpdateReplacePolicy', 'Retain');
  }
}
