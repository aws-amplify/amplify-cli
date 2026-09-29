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

export function defineAdminapiApi(backend: Backend) {
  const stack = backend.createStack('rest-api-stack-adminapi');
  const adminapiApi = new RestApi(stack, 'RestApi', {
    restApiName: `adminapi-${branchName}`,
  });
  adminapiApi.addGatewayResponse('Default4XX', {
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
  adminapiApi.addGatewayResponse('Default5XX', {
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
  const adminIntegration = new LambdaIntegration(
    backend.admin.resources.lambda
  );
  const gen1adminapiApi = RestApi.fromRestApiAttributes(
    stack,
    'Gen1adminapiApi',
    {
      restApiId: 'hpgcgkhgrd',
      rootResourceId: 'hpgcgkhgrd-root',
    }
  );
  const gen1adminapiPolicy = new Policy(stack, 'Gen1adminapiPolicy', {
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
  const admin = adminapiApi.root.addResource('admin', {
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
  admin.addMethod('ANY', adminIntegration);
  admin.addProxy({
    anyMethod: true,
    defaultIntegration: adminIntegration,
  });
  // /admin - Admin group only
  backend.auth.resources.groups['Admin'].role.attachInlinePolicy(
    new Policy(stack, 'adminAdminPolicy', {
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
  backend.auth.resources.groups['Admin'].role.attachInlinePolicy(
    new Policy(stack, 'gen1AdminAdminPolicy', {
      statements: [
        new PolicyStatement({
          actions: ['execute-api:Invoke'],
          resources: [
            gen1adminapiApi.arnForExecuteApi('GET', '/admin'),
            gen1adminapiApi.arnForExecuteApi('GET', '/admin/*'),
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
}
