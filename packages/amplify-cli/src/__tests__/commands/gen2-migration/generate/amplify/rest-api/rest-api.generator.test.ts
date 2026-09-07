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

  it('renders Cognito authorizer and admin permissions for AdminQueries API', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        AdminQueries: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main', ApiId: 'abc123' },
          dependsOn: [
            { category: 'auth', resourceName: 'myAuth', attributes: ['UserPoolId'] },
            { category: 'function', resourceName: 'AdminQueriesd29134db', attributes: ['Arn', 'Name'] },
          ],
        },
      },
      auth: { myAuth: { service: 'Cognito', output: { UserPoolId: 'us-east-1_abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/{proxy+}': { lambdaFunction: 'AdminQueriesd29134db', permissions: { setting: 'private' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'AdminQueries',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).toMatchInlineSnapshot(`
      "import {
        RestApi,
        LambdaIntegration,
        AuthorizationType,
        Cors,
        ResponseType,
        CognitoUserPoolsAuthorizer,
      } from 'aws-cdk-lib/aws-apigateway';
      import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
      import { Stack } from 'aws-cdk-lib';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export function defineAdminQueriesApi(backend: Backend) {
        const stack = backend.createStack('rest-api-stack-AdminQueries');
        const AdminQueriesApi = new RestApi(stack, 'RestApi', {
          restApiName: \`AdminQueries-\${branchName}\`,
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
        AdminQueriesApi.addGatewayResponse('Default4XX', {
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
        AdminQueriesApi.addGatewayResponse('Default5XX', {
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
        const AdminQueriesd29134dbIntegration = new LambdaIntegration(
          backend.AdminQueriesd29134db.resources.lambda
        );
        const adminQueriesCognitoAuthorizer = new CognitoUserPoolsAuthorizer(
          stack,
          'CognitoAuthorizer',
          {
            cognitoUserPools: [backend.auth.resources.userPool],
            identitySource: 'method.request.header.Authorization',
          }
        );
        const adminQueriesMethodOptions = {
          authorizationType: AuthorizationType.COGNITO,
          authorizer: adminQueriesCognitoAuthorizer,
          authorizationScopes: ['aws.cognito.signin.user.admin'],
        };
        const gen1AdminQueriesApi = RestApi.fromRestApiAttributes(
          stack,
          'Gen1AdminQueriesApi',
          {
            restApiId: 'abc123',
            rootResourceId: 'root-resource-id',
          }
        );
        const gen1AdminQueriesPolicy = new Policy(stack, 'Gen1AdminQueriesPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['execute-api:Invoke'],
              resources: [\`\${gen1AdminQueriesApi.arnForExecuteApi('GET', '/*')}\`],
            }),
          ],
        });
        backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
          gen1AdminQueriesPolicy
        );
        const root = AdminQueriesApi.root;
        root.addMethod(
          'ANY',
          AdminQueriesd29134dbIntegration,
          adminQueriesMethodOptions
        );
        const rootProxy = root.addProxy({
          anyMethod: false,
          defaultIntegration: AdminQueriesd29134dbIntegration,
        });
        rootProxy.addMethod(
          'ANY',
          AdminQueriesd29134dbIntegration,
          adminQueriesMethodOptions
        );
        backend.AdminQueriesd29134db.resources.lambda.addToRolePolicy(
          new PolicyStatement({
            actions: [
              'cognito-idp:AdminAddUserToGroup',
              'cognito-idp:AdminConfirmSignUp',
              'cognito-idp:AdminDisableUser',
              'cognito-idp:AdminEnableUser',
              'cognito-idp:AdminGetUser',
              'cognito-idp:AdminListGroupsForUser',
              'cognito-idp:AdminRemoveUserFromGroup',
              'cognito-idp:AdminUserGlobalSignOut',
              'cognito-idp:ListGroups',
              'cognito-idp:ListUsers',
              'cognito-idp:ListUsersInGroup',
            ],
            resources: [
              backend.auth.resources.userPool.userPoolArn,
              Stack.of(AdminQueriesApi).formatArn({
                service: 'cognito-idp',
                resource: 'userpool',
                resourceName: 'us-east-1_abc123',
              }),
            ],
          })
        );
        backend.addOutput({
          custom: {
            API: {
              [AdminQueriesApi.restApiName]: {
                endpoint: AdminQueriesApi.url.slice(0, -1),
                region: Stack.of(AdminQueriesApi).region,
                apiName: AdminQueriesApi.restApiName,
              },
            },
          },
        });
      }
      "
    `);
  });

  it('does not apply AdminQueries wiring based only on a function name prefix', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        ReportsApi: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main', ApiId: 'abc123' },
        },
      },
      auth: { myAuth: { service: 'Cognito', output: { UserPoolId: 'us-east-1_abc123' } } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/reports': { lambdaFunction: 'AdminQueriesReports', permissions: { setting: 'open' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'ReportsApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).not.toContain('CognitoUserPoolsAuthorizer');
    expect(output).not.toContain('adminQueriesMethodOptions');
    expect(output).not.toContain('cognito-idp:AdminGetUser');
  });

  it('does not render AdminQueries auth wiring when the auth category is absent', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        AdminQueries: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main', ApiId: 'abc123' },
          dependsOn: [
            { category: 'auth', resourceName: 'missingAuth', attributes: ['UserPoolId'] },
            { category: 'function', resourceName: 'AdminQueriesd29134db', attributes: ['Arn', 'Name'] },
          ],
        },
      },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/{proxy+}': { lambdaFunction: 'AdminQueriesd29134db', permissions: { setting: 'private' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'AdminQueries',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).not.toContain('CognitoUserPoolsAuthorizer');
    expect(output).not.toContain('backend.auth');
    expect(output).not.toContain('cognito-idp:AdminGetUser');
  });

  it('warns and scopes AdminQueries permissions to the Gen2 pool when the Gen1 pool ID is missing', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      api: {
        AdminQueries: {
          service: 'API Gateway',
          output: { RootUrl: 'https://abc123.execute-api.us-east-1.amazonaws.com/main', ApiId: 'abc123' },
          dependsOn: [
            { category: 'auth', resourceName: 'myAuth', attributes: ['UserPoolId'] },
            { category: 'function', resourceName: 'AdminQueriesd29134db', attributes: ['Arn', 'Name'] },
          ],
        },
      },
      auth: { myAuth: { service: 'Cognito', output: {} } },
    });
    jest.spyOn(gen1App, 'cliInputs').mockReturnValue({
      paths: { '/{proxy+}': { lambdaFunction: 'AdminQueriesd29134db', permissions: { setting: 'private' } } },
    });
    jest.spyOn(gen1App.aws, 'fetchRestApiRootResourceId').mockResolvedValue('root-resource-id');
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation();

    const generator = new RestApiGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'api',
        resourceName: 'AdminQueries',
        service: 'API Gateway',
        key: 'api:API Gateway',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("AdminQueries API 'AdminQueries' detected"));
    const output = writtenFile('resource.ts');
    expect(output).toMatchInlineSnapshot(`
      "import {
        RestApi,
        LambdaIntegration,
        AuthorizationType,
        Cors,
        ResponseType,
        CognitoUserPoolsAuthorizer,
      } from 'aws-cdk-lib/aws-apigateway';
      import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
      import { Stack } from 'aws-cdk-lib';
      import type { Backend } from '../../backend';

      const branchName = process.env.AWS_BRANCH ?? 'sandbox';

      export function defineAdminQueriesApi(backend: Backend) {
        const stack = backend.createStack('rest-api-stack-AdminQueries');
        const AdminQueriesApi = new RestApi(stack, 'RestApi', {
          restApiName: \`AdminQueries-\${branchName}\`,
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
        AdminQueriesApi.addGatewayResponse('Default4XX', {
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
        AdminQueriesApi.addGatewayResponse('Default5XX', {
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
        const AdminQueriesd29134dbIntegration = new LambdaIntegration(
          backend.AdminQueriesd29134db.resources.lambda
        );
        const adminQueriesCognitoAuthorizer = new CognitoUserPoolsAuthorizer(
          stack,
          'CognitoAuthorizer',
          {
            cognitoUserPools: [backend.auth.resources.userPool],
            identitySource: 'method.request.header.Authorization',
          }
        );
        const adminQueriesMethodOptions = {
          authorizationType: AuthorizationType.COGNITO,
          authorizer: adminQueriesCognitoAuthorizer,
          authorizationScopes: ['aws.cognito.signin.user.admin'],
        };
        const gen1AdminQueriesApi = RestApi.fromRestApiAttributes(
          stack,
          'Gen1AdminQueriesApi',
          {
            restApiId: 'abc123',
            rootResourceId: 'root-resource-id',
          }
        );
        const gen1AdminQueriesPolicy = new Policy(stack, 'Gen1AdminQueriesPolicy', {
          statements: [
            new PolicyStatement({
              actions: ['execute-api:Invoke'],
              resources: [\`\${gen1AdminQueriesApi.arnForExecuteApi('GET', '/*')}\`],
            }),
          ],
        });
        backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
          gen1AdminQueriesPolicy
        );
        const root = AdminQueriesApi.root;
        root.addMethod(
          'ANY',
          AdminQueriesd29134dbIntegration,
          adminQueriesMethodOptions
        );
        const rootProxy = root.addProxy({
          anyMethod: false,
          defaultIntegration: AdminQueriesd29134dbIntegration,
        });
        rootProxy.addMethod(
          'ANY',
          AdminQueriesd29134dbIntegration,
          adminQueriesMethodOptions
        );
        backend.AdminQueriesd29134db.resources.lambda.addToRolePolicy(
          new PolicyStatement({
            actions: [
              'cognito-idp:AdminAddUserToGroup',
              'cognito-idp:AdminConfirmSignUp',
              'cognito-idp:AdminDisableUser',
              'cognito-idp:AdminEnableUser',
              'cognito-idp:AdminGetUser',
              'cognito-idp:AdminListGroupsForUser',
              'cognito-idp:AdminRemoveUserFromGroup',
              'cognito-idp:AdminUserGlobalSignOut',
              'cognito-idp:ListGroups',
              'cognito-idp:ListUsers',
              'cognito-idp:ListUsersInGroup',
            ],
            resources: [backend.auth.resources.userPool.userPoolArn],
          })
        );
        backend.addOutput({
          custom: {
            API: {
              [AdminQueriesApi.restApiName]: {
                endpoint: AdminQueriesApi.url.slice(0, -1),
                region: Stack.of(AdminQueriesApi).region,
                apiName: AdminQueriesApi.restApiName,
              },
            },
          },
        });
      }
      "
    `);
  });
});
