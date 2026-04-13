import { auth } from './auth/resource';
import { data } from './data/resource';
import { fitnesstracker33f5545533f55455PreSignup } from './auth/fitnesstracker33f5545533f55455PreSignup/resource';
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
import { defineBackend } from '@aws-amplify/backend';
import { Duration, Stack } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  fitnesstracker33f5545533f55455PreSignup,
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
const 3f11ed2aac.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';
backend.fitnesstracker33f5545533f55455PreSignup.resources.cfnResources.cfnFunction.functionName = `fitnesstracker33f5545533f55455PreSignup-${3f11ed2aac.deploymentTypeName}`;
backend.lognutrition.resources.cfnResources.cfnFunction.functionName = `lognutrition-${3f11ed2aac.deploymentTypeName}`;
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
backend.admin.resources.cfnResources.cfnFunction.functionName = `admin-${3f11ed2aac.deploymentTypeName}`;
backend.admin.addEnvironment(
  'AUTH_FITNESSTRACKER33F5545533F55455_USERPOOLID',
  backend.auth.resources.userPool.userPoolId
);
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
  {
    authenticationType: 'API_KEY',
  },
];
const api.5c8596b905.ApiName.ApiNameStack = backend.createStack('rest-api-stack-api.5c8596b905.ApiName.ApiName');
const api.5c8596b905.ApiName.ApiNameApi = new RestApi(api.5c8596b905.ApiName.ApiNameStack, 'RestApi', {
  restApiName: `api.5c8596b905.ApiName.ApiName-${3f11ed2aac.deploymentTypeName}`,
});
api.5c8596b905.ApiName.ApiNameApi.addGatewayResponse('Default4XX', {
  type: ResponseType.DEFAULT_4XX,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
  },
});
api.5c8596b905.ApiName.ApiNameApi.addGatewayResponse('Default5XX', {
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
const gen1api.5c8596b905.ApiName.ApiNameApi = RestApi.fromRestApiAttributes(
  api.5c8596b905.ApiName.ApiNameStack,
  'Gen1api.5c8596b905.ApiName.ApiNameApi',
  {
    restApiId: 'api.5c8596b905.ApiName.ApiId',
    rootResourceId: 'api.5c8596b905.ApiName.ApiId-root',
  }
);
const gen1api.5c8596b905.ApiName.ApiNamePolicy = new Policy(
  api.5c8596b905.ApiName.ApiNameStack,
  'Gen1api.5c8596b905.ApiName.ApiNamePolicy',
  {
    statements: [
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          `${gen1api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('POST', '/*')}`,
          `${gen1api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('GET', '/*')}`,
          `${gen1api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('PUT', '/*')}`,
          `${gen1api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('DELETE', '/*')}`,
        ],
      }),
    ],
  }
);
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  gen1api.5c8596b905.ApiName.ApiNamePolicy
);
const nutritionlog = api.5c8596b905.ApiName.ApiNameApi.root
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
  new Policy(api.5c8596b905.ApiName.ApiNameStack, 'nutritionlogAuthPolicy', {
    statements: [
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('POST', '/nutrition/log'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('POST', '/nutrition/log/*'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('GET', '/nutrition/log'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('GET', '/nutrition/log/*'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('PUT', '/nutrition/log'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('PUT', '/nutrition/log/*'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('DELETE', '/nutrition/log'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('DELETE', '/nutrition/log/*'),
        ],
      }),
    ],
  })
);
// /nutrition/log - Admin group only
backend.auth.resources.groups['Admin'].role.attachInlinePolicy(
  new Policy(api.5c8596b905.ApiName.ApiNameStack, 'nutritionlogAdminPolicy', {
    statements: [
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('POST', '/nutrition/log'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('POST', '/nutrition/log/*'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('GET', '/nutrition/log'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('GET', '/nutrition/log/*'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('PUT', '/nutrition/log'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('PUT', '/nutrition/log/*'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('DELETE', '/nutrition/log'),
          api.5c8596b905.ApiName.ApiNameApi.arnForExecuteApi('DELETE', '/nutrition/log/*'),
        ],
      }),
    ],
  })
);
backend.addOutput({
  custom: {
    API: {
      [api.5c8596b905.ApiName.ApiNameApi.restApiName]: {
        endpoint: api.5c8596b905.ApiName.ApiNameApi.url.slice(0, -1),
        region: Stack.of(api.5c8596b905.ApiName.ApiNameApi).region,
        apiName: api.5c8596b905.ApiName.ApiNameApi.restApiName,
      },
    },
  },
});
const api.d809bc5a09.ApiName.ApiNameStack = backend.createStack('rest-api-stack-api.d809bc5a09.ApiName.ApiName');
const api.d809bc5a09.ApiName.ApiNameApi = new RestApi(api.d809bc5a09.ApiName.ApiNameStack, 'RestApi', {
  restApiName: `api.d809bc5a09.ApiName.ApiName-${3f11ed2aac.deploymentTypeName}`,
});
api.d809bc5a09.ApiName.ApiNameApi.addGatewayResponse('Default4XX', {
  type: ResponseType.DEFAULT_4XX,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
  },
});
api.d809bc5a09.ApiName.ApiNameApi.addGatewayResponse('Default5XX', {
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
const gen1api.d809bc5a09.ApiName.ApiNameApi = RestApi.fromRestApiAttributes(
  api.d809bc5a09.ApiName.ApiNameStack,
  'Gen1api.d809bc5a09.ApiName.ApiNameApi',
  {
    restApiId: 'api.api.d809bc5a09.ApiName.ApiName.ApiId',
    rootResourceId: 'api.api.d809bc5a09.ApiName.ApiName.ApiId-root',
  }
);
const gen1api.d809bc5a09.ApiName.ApiNamePolicy = new Policy(api.d809bc5a09.ApiName.ApiNameStack, 'Gen1api.d809bc5a09.ApiName.ApiNamePolicy', {
  statements: [
    new PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [`${gen1api.d809bc5a09.ApiName.ApiNameApi.arnForExecuteApi('GET', '/*')}`],
    }),
  ],
});
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  gen1api.d809bc5a09.ApiName.ApiNamePolicy
);
const adminResource = api.d809bc5a09.ApiName.ApiNameApi.root.addResource('admin', {
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
  new Policy(api.d809bc5a09.ApiName.ApiNameStack, 'adminAdminPolicy', {
    statements: [
      new PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          api.d809bc5a09.ApiName.ApiNameApi.arnForExecuteApi('GET', '/admin'),
          api.d809bc5a09.ApiName.ApiNameApi.arnForExecuteApi('GET', '/admin/*'),
        ],
      }),
    ],
  })
);
backend.addOutput({
  custom: {
    API: {
      [api.d809bc5a09.ApiName.ApiNameApi.restApiName]: {
        endpoint: api.d809bc5a09.ApiName.ApiNameApi.url.slice(0, -1),
        region: Stack.of(api.d809bc5a09.ApiName.ApiNameApi).region,
        apiName: api.d809bc5a09.ApiName.ApiNameApi.restApiName,
      },
    },
  },
});
