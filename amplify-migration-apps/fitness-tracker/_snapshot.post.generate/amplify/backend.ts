import { auth } from './auth/resource';
import { data } from './data/resource';
import { fitnesstracker6b0fc1196b0fc119PreSignup } from './auth/fitnesstracker6b0fc1196b0fc119PreSignup/resource';
import { lognutrition } from './function/lognutrition/resource';
import { admin } from './function/admin/resource';
import {
  RestApi,
  LambdaIntegration,
  AuthorizationType,
  Cors,
  ResponseType,
} from 'aws-cdk-lib/aws-apigateway';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  fitnesstracker6b0fc1196b0fc119PreSignup,
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
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  disableOAuth: true,
  generateSecret: false,
});
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
  {
    authenticationType: 'API_KEY',
  },
];
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const nutritionapiStack = backend.createStack('rest-api-stack-nutritionapi');
const nutritionapiApi = new RestApi(nutritionapiStack, 'RestApi', {
  restApiName: `nutritionapi-${branchName}`,
});
nutritionapiApi.addGatewayResponse('Default4XX', {
  type: ResponseType.DEFAULT_4XX,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
  },
});
nutritionapiApi.addGatewayResponse('Default5XX', {
  type: ResponseType.DEFAULT_5XX,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
  },
});
const lognutritionIntegration = new LambdaIntegration(
  backend.lognutrition.resources.lambda
);
const gen1nutritionapiApi = RestApi.fromRestApiAttributes(
  nutritionapiStack,
  'Gen1nutritionapiApi',
  {
    restApiId: '<gen1-nutritionapi-api-id>',
    rootResourceId: '<gen1-nutritionapi-root-resource-id>',
  }
);
const gen1nutritionapiPolicy = new Policy(
  nutritionapiStack,
  'Gen1nutritionapiPolicy',
  {
    statements: [
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          `${gen1nutritionapiApi.arnForExecuteApi('POST', '/*')}`,
          `${gen1nutritionapiApi.arnForExecuteApi('GET', '/*')}`,
          `${gen1nutritionapiApi.arnForExecuteApi('PUT', '/*')}`,
          `${gen1nutritionapiApi.arnForExecuteApi('DELETE', '/*')}`,
        ],
      }),
    ],
  }
);
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  gen1nutritionapiPolicy
);
const nutritionlog = nutritionapiApi.root
  .addResource('nutrition')
  .addResource('log', {
    defaultMethodOptions: {
      authorizationType: AuthorizationType.IAM,
    },
    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
        'X-Amz-User-Agent',
      ],
      statusCode: 200,
    },
  });
nutritionlog.addMethod('ANY', lognutritionIntegration);
nutritionlog.addProxy({
  anyMethod: true,
  defaultIntegration: lognutritionIntegration,
});
// /nutrition/log - all authenticated users
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  new Policy(nutritionapiStack, 'nutritionlogAuthPolicy', {
    statements: [
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          nutritionapiApi.arnForExecuteApi('POST', '/nutrition/log'),
          nutritionapiApi.arnForExecuteApi('POST', '/nutrition/log/*'),
          nutritionapiApi.arnForExecuteApi('GET', '/nutrition/log'),
          nutritionapiApi.arnForExecuteApi('GET', '/nutrition/log/*'),
          nutritionapiApi.arnForExecuteApi('PUT', '/nutrition/log'),
          nutritionapiApi.arnForExecuteApi('PUT', '/nutrition/log/*'),
          nutritionapiApi.arnForExecuteApi('DELETE', '/nutrition/log'),
          nutritionapiApi.arnForExecuteApi('DELETE', '/nutrition/log/*'),
        ],
      }),
    ],
  })
);
// /nutrition/log - Admin group only
backend.auth.resources.groups['Admin'].role.attachInlinePolicy(
  new Policy(nutritionapiStack, 'nutritionlogAdminPolicy', {
    statements: [
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          nutritionapiApi.arnForExecuteApi('POST', '/nutrition/log'),
          nutritionapiApi.arnForExecuteApi('POST', '/nutrition/log/*'),
          nutritionapiApi.arnForExecuteApi('GET', '/nutrition/log'),
          nutritionapiApi.arnForExecuteApi('GET', '/nutrition/log/*'),
          nutritionapiApi.arnForExecuteApi('PUT', '/nutrition/log'),
          nutritionapiApi.arnForExecuteApi('PUT', '/nutrition/log/*'),
          nutritionapiApi.arnForExecuteApi('DELETE', '/nutrition/log'),
          nutritionapiApi.arnForExecuteApi('DELETE', '/nutrition/log/*'),
        ],
      }),
    ],
  })
);
backend.addOutput({
  custom: {
    API: {
      [nutritionapiApi.restApiName]: {
        endpoint: nutritionapiApi.url.slice(0, -1),
        region: Stack.of(nutritionapiApi).region,
        apiName: nutritionapiApi.restApiName,
      },
    },
  },
});
const adminapiStack = backend.createStack('rest-api-stack-adminapi');
const adminapiApi = new RestApi(adminapiStack, 'RestApi', {
  restApiName: `adminapi-${branchName}`,
});
adminapiApi.addGatewayResponse('Default4XX', {
  type: ResponseType.DEFAULT_4XX,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
  },
});
adminapiApi.addGatewayResponse('Default5XX', {
  type: ResponseType.DEFAULT_5XX,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
  },
});
const adminIntegration = new LambdaIntegration(backend.admin.resources.lambda);
const gen1adminapiApi = RestApi.fromRestApiAttributes(
  adminapiStack,
  'Gen1adminapiApi',
  {
    restApiId: '<gen1-adminapi-api-id>',
    rootResourceId: '<gen1-adminapi-root-resource-id>',
  }
);
const gen1adminapiPolicy = new Policy(adminapiStack, 'Gen1adminapiPolicy', {
  statements: [
    new PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [`${gen1adminapiApi.arnForExecuteApi('GET', '/*')}`],
    }),
  ],
});
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  gen1adminapiPolicy
);
const adminResource = adminapiApi.root.addResource('admin', {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.IAM,
  },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: Cors.ALL_METHODS,
    allowHeaders: [
      'Content-Type',
      'X-Amz-Date',
      'Authorization',
      'X-Api-Key',
      'X-Amz-Security-Token',
      'X-Amz-User-Agent',
    ],
    statusCode: 200,
  },
});
adminResource.addMethod('ANY', adminIntegration);
adminResource.addProxy({
  anyMethod: true,
  defaultIntegration: adminIntegration,
});
// /admin - Admin group only
backend.auth.resources.groups['Admin'].role.attachInlinePolicy(
  new Policy(adminapiStack, 'adminAdminPolicy', {
    statements: [
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          adminapiApi.arnForExecuteApi('GET', '/admin'),
          adminapiApi.arnForExecuteApi('GET', '/admin/*'),
        ],
      }),
    ],
  })
);
backend.addOutput({
  custom: {
    API: {
      [adminapiApi.restApiName]: {
        endpoint: adminapiApi.url.slice(0, -1),
        region: Stack.of(adminapiApi).region,
        apiName: adminapiApi.restApiName,
      },
    },
  },
});
backend.fitnesstracker6b0fc1196b0fc119PreSignup.resources.cfnResources.cfnFunction.functionName = `fitnesstracker6b0fc1196b0fc119PreSignup-${branchName}`;
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
  'AUTH_FITNESSTRACKER6B0FC1196B0FC119_USERPOOLID',
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
