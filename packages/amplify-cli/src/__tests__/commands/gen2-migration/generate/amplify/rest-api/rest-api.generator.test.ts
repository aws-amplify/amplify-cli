import { RestApiGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/rest-api/rest-api.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { createGen1App } from '../../_helpers/create-gen1-app';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';

jest.unmock('fs-extra');

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

function writtenFile(suffix: string): string {
  const call = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith(suffix));
  if (!call) throw new Error(`No writeFile call ending with '${suffix}'`);
  return call[1] as string;
}

describe('RestApiGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/tmp/test-output';
  const logger = new SpinningLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
  });

  it('returns one operation with correct description', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myApi');
  });

  it('contributes namespace import and post-define statement to backend generator on execute', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addPostDefineStatementSpy = jest.spyOn(backendGenerator, 'addPostDefineBackendStatement');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('myApi', './api/myApi/resource');
    expect(addPostDefineStatementSpy).toHaveBeenCalled();
  });

  it('renders a basic REST API', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root456');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import {
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

      export function defineMyApiApi(backend: Backend) {
        const stack = backend.createStack('rest-api-stack-myApi');
        const myApiApi = new RestApi(stack, 'RestApi', {
          restApiName: \`myApi-\${branchName}\`,
        });
        myApiApi.addGatewayResponse('Default4XX', {
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
        myApiApi.addGatewayResponse('Default5XX', {
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
        const myFuncIntegration = new LambdaIntegration(
          backend.myFunc.resources.lambda
        );
        const gen1myApiApi = RestApi.fromRestApiAttributes(stack, 'Gen1myApiApi', {
          restApiId: 'abc123',
          rootResourceId: 'root456',
        });
        const gen1myApiPolicy = new Policy(stack, 'Gen1myApiPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['execute-api:Invoke'],
              resources: [\`\${gen1myApiApi.arnForExecuteApi('GET', '/*')}\`],
            }),
          ],
        });
        const items = myApiApi.root.addResource('items', {
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
        items.addMethod('ANY', myFuncIntegration);
        items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration,
        });
        backend.addOutput({
          custom: {
            API: {
              [myApiApi.restApiName]: {
                endpoint: myApiApi.url.slice(0, -1),
                region: Stack.of(myApiApi).region,
                apiName: myApiApi.restApiName,
              },
            },
          },
        });
      }
      "
    `);
  });

  it('renders Lambda integrations for unique functions', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: {
        '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
        '/other': { lambdaFunction: 'otherFunc', permissions: { setting: 'open' } },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import {
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

      export function defineMyApiApi(backend: Backend) {
        const stack = backend.createStack('rest-api-stack-myApi');
        const myApiApi = new RestApi(stack, 'RestApi', {
          restApiName: \`myApi-\${branchName}\`,
        });
        myApiApi.addGatewayResponse('Default4XX', {
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
        myApiApi.addGatewayResponse('Default5XX', {
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
        const myFuncIntegration = new LambdaIntegration(
          backend.myFunc.resources.lambda
        );
        const otherFuncIntegration = new LambdaIntegration(
          backend.otherFunc.resources.lambda
        );
        const gen1myApiApi = RestApi.fromRestApiAttributes(stack, 'Gen1myApiApi', {
          restApiId: 'abc123',
          rootResourceId: 'root-resource-id',
        });
        const gen1myApiPolicy = new Policy(stack, 'Gen1myApiPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['execute-api:Invoke'],
              resources: [
                \`\${gen1myApiApi.arnForExecuteApi('GET', '/*')}\`,
                \`\${gen1myApiApi.arnForExecuteApi('GET', '/*')}\`,
              ],
            }),
          ],
        });
        const items = myApiApi.root.addResource('items', {
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
        items.addMethod('ANY', myFuncIntegration);
        items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration,
        });
        const other = myApiApi.root.addResource('other', {
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
        other.addMethod('ANY', otherFuncIntegration);
        other.addProxy({
          anyMethod: true,
          defaultIntegration: otherFuncIntegration,
        });
        backend.addOutput({
          custom: {
            API: {
              [myApiApi.restApiName]: {
                endpoint: myApiApi.url.slice(0, -1),
                region: Stack.of(myApiApi).region,
                apiName: myApiApi.restApiName,
              },
            },
          },
        });
      }
      "
    `);
  });

  it('renders policy attachment when auth exists and path is private', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
      auth: { myAuth: { service: 'Cognito' } },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'private' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import {
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

      export function defineMyApiApi(backend: Backend) {
        const stack = backend.createStack('rest-api-stack-myApi');
        const myApiApi = new RestApi(stack, 'RestApi', {
          restApiName: \`myApi-\${branchName}\`,
        });
        myApiApi.addGatewayResponse('Default4XX', {
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
        myApiApi.addGatewayResponse('Default5XX', {
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
        const myFuncIntegration = new LambdaIntegration(
          backend.myFunc.resources.lambda
        );
        const gen1myApiApi = RestApi.fromRestApiAttributes(stack, 'Gen1myApiApi', {
          restApiId: 'abc123',
          rootResourceId: 'root-resource-id',
        });
        const gen1myApiPolicy = new Policy(stack, 'Gen1myApiPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['execute-api:Invoke'],
              resources: [\`\${gen1myApiApi.arnForExecuteApi('GET', '/*')}\`],
            }),
          ],
        });
        backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
          gen1myApiPolicy
        );
        const items = myApiApi.root.addResource('items', {
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
        items.addMethod('ANY', myFuncIntegration);
        items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration,
        });
        backend.addOutput({
          custom: {
            API: {
              [myApiApi.restApiName]: {
                endpoint: myApiApi.url.slice(0, -1),
                region: Stack.of(myApiApi).region,
                apiName: myApiApi.restApiName,
              },
            },
          },
        });
      }
      "
    `);
  });

  it('does not render policy attachment when no auth', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'private' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).not.toContain('attachInlinePolicy(gen1myApiPolicy)');
  });

  it('renders auth path policies when permissions.auth is set', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
      auth: { myAuth: { service: 'Cognito' } },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: {
        '/items': {
          lambdaFunction: 'myFunc',
          permissions: { setting: 'private', auth: ['read', 'create'] },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import {
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

      export function defineMyApiApi(backend: Backend) {
        const stack = backend.createStack('rest-api-stack-myApi');
        const myApiApi = new RestApi(stack, 'RestApi', {
          restApiName: \`myApi-\${branchName}\`,
        });
        myApiApi.addGatewayResponse('Default4XX', {
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
        myApiApi.addGatewayResponse('Default5XX', {
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
        const myFuncIntegration = new LambdaIntegration(
          backend.myFunc.resources.lambda
        );
        const gen1myApiApi = RestApi.fromRestApiAttributes(stack, 'Gen1myApiApi', {
          restApiId: 'abc123',
          rootResourceId: 'root-resource-id',
        });
        const gen1myApiPolicy = new Policy(stack, 'Gen1myApiPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['execute-api:Invoke'],
              resources: [
                \`\${gen1myApiApi.arnForExecuteApi('GET', '/*')}\`,
                \`\${gen1myApiApi.arnForExecuteApi('POST', '/*')}\`,
              ],
            }),
          ],
        });
        backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
          gen1myApiPolicy
        );
        const items = myApiApi.root.addResource('items', {
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
        items.addMethod('ANY', myFuncIntegration);
        items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration,
        });
        // /items - all authenticated users
        backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
          new Policy(stack, 'itemsAuthPolicy', {
            statements: [
              new PolicyStatement({
                actions: ['execute-api:Invoke'],
                resources: [
                  myApiApi.arnForExecuteApi('GET', '/items'),
                  myApiApi.arnForExecuteApi('GET', '/items/*'),
                  myApiApi.arnForExecuteApi('POST', '/items'),
                  myApiApi.arnForExecuteApi('POST', '/items/*'),
                ],
              }),
            ],
          })
        );
        backend.addOutput({
          custom: {
            API: {
              [myApiApi.restApiName]: {
                endpoint: myApiApi.url.slice(0, -1),
                region: Stack.of(myApiApi).region,
                apiName: myApiApi.restApiName,
              },
            },
          },
        });
      }
      "
    `);
  });

  it('renders group path policies', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
      auth: { myAuth: { service: 'Cognito' } },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: {
        '/admin': {
          lambdaFunction: 'myFunc',
          permissions: { setting: 'protected', groups: { admins: ['read'] } },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import {
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

      export function defineMyApiApi(backend: Backend) {
        const stack = backend.createStack('rest-api-stack-myApi');
        const myApiApi = new RestApi(stack, 'RestApi', {
          restApiName: \`myApi-\${branchName}\`,
        });
        myApiApi.addGatewayResponse('Default4XX', {
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
        myApiApi.addGatewayResponse('Default5XX', {
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
        const myFuncIntegration = new LambdaIntegration(
          backend.myFunc.resources.lambda
        );
        const gen1myApiApi = RestApi.fromRestApiAttributes(stack, 'Gen1myApiApi', {
          restApiId: 'abc123',
          rootResourceId: 'root-resource-id',
        });
        const gen1myApiPolicy = new Policy(stack, 'Gen1myApiPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['execute-api:Invoke'],
              resources: [\`\${gen1myApiApi.arnForExecuteApi('GET', '/*')}\`],
            }),
          ],
        });
        backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
          gen1myApiPolicy
        );
        const admin = myApiApi.root.addResource('admin', {
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
        admin.addMethod('ANY', myFuncIntegration);
        admin.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration,
        });
        // /admin - admins group only
        backend.auth.resources.groups['admins'].role.attachInlinePolicy(
          new Policy(stack, 'adminadminsPolicy', {
            statements: [
              new PolicyStatement({
                actions: ['execute-api:Invoke'],
                resources: [
                  myApiApi.arnForExecuteApi('GET', '/admin'),
                  myApiApi.arnForExecuteApi('GET', '/admin/*'),
                ],
              }),
            ],
          })
        );
        backend.auth.resources.groups['admins'].role.attachInlinePolicy(
          new Policy(stack, 'gen1AdminadminsPolicy', {
            statements: [
              new PolicyStatement({
                actions: ['execute-api:Invoke'],
                resources: [
                  gen1myApiApi.arnForExecuteApi('GET', '/admin'),
                  gen1myApiApi.arnForExecuteApi('GET', '/admin/*'),
                ],
              }),
            ],
          })
        );
        backend.addOutput({
          custom: {
            API: {
              [myApiApi.restApiName]: {
                endpoint: myApiApi.url.slice(0, -1),
                region: Stack.of(myApiApi).region,
                apiName: myApiApi.restApiName,
              },
            },
          },
        });
      }
      "
    `);
  });

  it('handles multiple paths', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: {
        '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
        '/users': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import {
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

      export function defineMyApiApi(backend: Backend) {
        const stack = backend.createStack('rest-api-stack-myApi');
        const myApiApi = new RestApi(stack, 'RestApi', {
          restApiName: \`myApi-\${branchName}\`,
        });
        myApiApi.addGatewayResponse('Default4XX', {
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
        myApiApi.addGatewayResponse('Default5XX', {
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
        const myFuncIntegration = new LambdaIntegration(
          backend.myFunc.resources.lambda
        );
        const gen1myApiApi = RestApi.fromRestApiAttributes(stack, 'Gen1myApiApi', {
          restApiId: 'abc123',
          rootResourceId: 'root-resource-id',
        });
        const gen1myApiPolicy = new Policy(stack, 'Gen1myApiPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['execute-api:Invoke'],
              resources: [
                \`\${gen1myApiApi.arnForExecuteApi('GET', '/*')}\`,
                \`\${gen1myApiApi.arnForExecuteApi('GET', '/*')}\`,
              ],
            }),
          ],
        });
        const items = myApiApi.root.addResource('items', {
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
        items.addMethod('ANY', myFuncIntegration);
        items.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration,
        });
        const users = myApiApi.root.addResource('users', {
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
        users.addMethod('ANY', myFuncIntegration);
        users.addProxy({
          anyMethod: true,
          defaultIntegration: myFuncIntegration,
        });
        backend.addOutput({
          custom: {
            API: {
              [myApiApi.restApiName]: {
                endpoint: myApiApi.url.slice(0, -1),
                region: Stack.of(myApiApi).region,
                apiName: myApiApi.restApiName,
              },
            },
          },
        });
      }
      "
    `);
  });

  it('sanitizes hyphenated path names into valid variable names', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/auth-test': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).toContain('authtest');
    expect(output).not.toContain('const auth-test');
  });

  it('sanitizes hyphenated api names in output', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        myApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('abc123');
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'myapi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).toContain('myapiApi');
  });
});
