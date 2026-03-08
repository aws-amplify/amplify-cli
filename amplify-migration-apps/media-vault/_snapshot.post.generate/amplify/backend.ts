import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { thumbnailgen } from './storage/thumbnailgen/resource';
import { addusertogroup } from './function/addusertogroup/resource';
import { removeuserfromgroup } from './function/removeuserfromgroup/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';
import {
  OAuthScope,
  UserPoolClientIdentityProvider,
} from 'aws-cdk-lib/aws-cognito';

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
const cfnUserPoolClient = backend.auth.resources.cfnResources.cfnUserPoolClient;
cfnUserPoolClient.allowedOAuthFlows = ['code'];
const userPool = backend.auth.resources.userPool;
const userPoolClient = userPool.addClient('NativeAppClient', {
  refreshTokenValidity: Duration.days(30),
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  supportedIdentityProviders: [
    UserPoolClientIdentityProvider.FACEBOOK,
    UserPoolClientIdentityProvider.GOOGLE,
    UserPoolClientIdentityProvider.COGNITO,
  ],
  oAuth: {
    callbackUrls: ['https://main.mediavault.amplifyapp.com/'],
    logoutUrls: ['https://main.mediavault.amplifyapp.com/'],
    flows: {
      authorizationCodeGrant: true,
      implicitCodeGrant: false,
      clientCredentials: false,
    },
    scopes: [
      OAuthScope.PHONE,
      OAuthScope.EMAIL,
      OAuthScope.OPENID,
      OAuthScope.PROFILE,
      OAuthScope.COGNITO_ADMIN,
    ],
  },
  // flows: ['code'],
  disableOAuth: false,
  generateSecret: false,
});
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'mediavaultb574f210f1634e3a8d1934f263da5bed61114-main';
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
const providerSetupResult = (
  backend.auth.stack.node.children.find(
    (child) => child.node.id === 'amplifyAuth'
  ) as any
).providerSetupResult;
Object.keys(providerSetupResult).forEach((provider) => {
  const providerSetupPropertyValue = providerSetupResult[provider];
  if (
    providerSetupPropertyValue.node &&
    providerSetupPropertyValue.node.id.toLowerCase().endsWith('idp')
  ) {
    userPoolClient.node.addDependency(providerSetupPropertyValue);
  }
});
// backend.auth.resources.userPool.node.tryRemoveChild("UserPoolDomain");
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
  'AUTH_MEDIAVAULT1F08412D_USERPOOLID',
  backend.auth.resources.userPool.userPoolId
);
backend.removeuserfromgroup.resources.cfnResources.cfnFunction.functionName = `removeuserfromgroup-${branchName}`;
backend.removeuserfromgroup.addEnvironment(
  'AUTH_MEDIAVAULT1F08412D_USERPOOLID',
  backend.auth.resources.userPool.userPoolId
);
