import { auth } from './auth/resource';
import { data } from './data/resource';
import { fitnesstracker969d5a9e969d5a9ePreSignup } from './auth/fitnesstracker969d5a9e969d5a9ePreSignup/resource';
import { lognutrition } from './function/lognutrition/resource';
import { admin } from './function/admin/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  fitnesstracker969d5a9e969d5a9ePreSignup,
  lognutrition,
  admin,
});
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.usernameAttributes = undefined;
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
  disableOAuth: true,
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  generateSecret: false,
});
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
  {
    authenticationType: 'API_KEY',
  },
];
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.fitnesstracker969d5a9e969d5a9ePreSignup.resources.cfnResources.cfnFunction.functionName = `fitnesstracker969d5a9e969d5a9ePreSignup-${branchName}`;
backend.lognutrition.resources.cfnResources.cfnFunction.functionName = `lognutrition-${branchName}`;
backend.lognutrition.addEnvironment(
  'API_FITNESSTRACKER_GRAPHQLAPIIDOUTPUT',
  backend.data.apiId
);
backend.lognutrition.addEnvironment(
  'API_FITNESSTRACKER_MEALTABLE_ARN',
  backend.data.resources.tables['Meal'].tableArn
);
backend.lognutrition.addEnvironment(
  'API_FITNESSTRACKER_MEALTABLE_NAME',
  backend.data.resources.tables['Meal'].tableName
);
backend.admin.resources.cfnResources.cfnFunction.functionName = `admin-${branchName}`;
backend.admin.addEnvironment(
  'AUTH_FITNESSTRACKER969D5A9E969D5A9E_USERPOOLID',
  backend.auth.resources.userPool.userPoolId
);
backend.data.resources.tables['Meal'].grant(
  backend.lognutrition.resources.lambda,
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
