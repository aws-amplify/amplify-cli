import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { cdkStack } from './custom/customfinance/resource';
import { cdkStack as customresolver_cdkStack } from './custom/customresolver/resource';
import { financetracker } from './function/financetracker/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  financetracker,
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
new cdkStack(backend.createStack('customfinance'), 'customfinance');
new customresolver_cdkStack(
  backend.createStack('customresolver'),
  'customresolver',
  backend
);
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.financetracker.resources.cfnResources.cfnFunction.functionName = `financetracker-${branchName}`;
backend.financetracker.addEnvironment(
  'API_FINANCETRACKER_GRAPHQLAPIIDOUTPUT',
  backend.data.apiId
);
backend.financetracker.addEnvironment(
  'API_FINANCETRACKER_TRANSACTIONTABLE_ARN',
  backend.data.resources.tables['Transaction'].tableArn
);
backend.financetracker.addEnvironment(
  'API_FINANCETRACKER_TRANSACTIONTABLE_NAME',
  backend.data.resources.tables['Transaction'].tableName
);
backend.data.resources.tables['Transaction'].grant(
  backend.financetracker.resources.lambda,
  'dynamodb:Put*',
  'dynamodb:Create*',
  'dynamodb:BatchWriteItem',
  'dynamodb:PartiQLInsert',
  'dynamodb:Get*',
  'dynamodb:BatchGetItem',
  'dynamodb:List*',
  'dynamodb:Describe*',
  'dynamodb:Scan',
  'dynamodb:Query',
  'dynamodb:PartiQLSelect',
  'dynamodb:Update*',
  'dynamodb:RestoreTable*',
  'dynamodb:PartiQLUpdate',
  'dynamodb:Delete*',
  'dynamodb:PartiQLDelete'
);
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'financetrackera14ace1bd4be4b579cb608d44266aea7x-x';
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
