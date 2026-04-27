import {
  RestApi,
  LambdaIntegration,
  AuthorizationType,
  Cors,
  ResponseType,
} from 'aws-cdk-lib/aws-apigateway';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export function defineNutritionapiApi(backend: Backend) {
  const stack = backend.createStack('rest-api-stack-nutritionapi');
  const nutritionapiApi = new RestApi(stack, 'RestApi', {
    restApiName: `nutritionapi-${branchName}`,
  });
  nutritionapiApi.addGatewayResponse('Default4XX', {
    type: ResponseType.DEFAULT_4XX,
    responseHeaders: {
      'Access-Control-Allow-Origin': "'*'",
      'Access-Control-Allow-Headers':
        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
      'Access-Control-Allow-Methods':
        "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
      'Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
    },
  });
  nutritionapiApi.addGatewayResponse('Default5XX', {
    type: ResponseType.DEFAULT_5XX,
    responseHeaders: {
      'Access-Control-Allow-Origin': "'*'",
      'Access-Control-Allow-Headers':
        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
      'Access-Control-Allow-Methods':
        "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
      'Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
    },
  });
  const lognutritionIntegration = new LambdaIntegration(
    backend.lognutrition.resources.lambda
  );
  const gen1nutritionapiApi = RestApi.fromRestApiAttributes(
    stack,
    'Gen1nutritionapiApi',
    {
      restApiId: 'xxhikloa6h',
      rootResourceId: 'xxhikloa6h-root',
    }
  );
  const gen1nutritionapiPolicy = new Policy(stack, 'Gen1nutritionapiPolicy', {
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
  });
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
    new Policy(stack, 'nutritionlogAuthPolicy', {
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
    new Policy(stack, 'nutritionlogAdminPolicy', {
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
  backend.auth.resources.groups['Admin'].role.attachInlinePolicy(
    new Policy(stack, 'gen1NutritionlogAdminPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['execute-api:Invoke'],
          resources: [
            gen1nutritionapiApi.arnForExecuteApi('POST', '/nutrition/log'),
            gen1nutritionapiApi.arnForExecuteApi('POST', '/nutrition/log/*'),
            gen1nutritionapiApi.arnForExecuteApi('GET', '/nutrition/log'),
            gen1nutritionapiApi.arnForExecuteApi('GET', '/nutrition/log/*'),
            gen1nutritionapiApi.arnForExecuteApi('PUT', '/nutrition/log'),
            gen1nutritionapiApi.arnForExecuteApi('PUT', '/nutrition/log/*'),
            gen1nutritionapiApi.arnForExecuteApi('DELETE', '/nutrition/log'),
            gen1nutritionapiApi.arnForExecuteApi('DELETE', '/nutrition/log/*'),
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
}
