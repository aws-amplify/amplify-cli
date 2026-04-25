import { RestApiGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/rest-api/rest-api.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

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

function createMockGen1App(): Gen1App {
  return {
    meta: jest.fn(),
    metaOutput: jest.fn(),
    ccbDir: '/tmp/ccb',
    cliInputs: jest.fn(),
    resourceMetaOutput: jest.fn(),
    categoryMeta: jest.fn(),
    aws: {
      fetchRestApiRootResourceId: jest.fn().mockResolvedValue('root-resource-id'),
    },
  } as unknown as Gen1App;
}
/** Sets up Gen1App mocks for a successful REST API plan(). */
function setupRestApiMocks(
  gen1App: Gen1App,
  opts?: {
    apiId?: string;
    rootResourceId?: string;
    paths?: Record<string, unknown>;
    hasAuth?: boolean;
  },
): void {
  const apiId = opts?.apiId ?? 'abc123';
  (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue(apiId);
  (gen1App.cliInputs as jest.Mock).mockReturnValue({
    paths: opts?.paths ?? {
      '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
    },
  });
  (gen1App.categoryMeta as jest.Mock).mockImplementation((category: string) => {
    if (category === 'auth') return opts?.hasAuth ? { myAuth: {} } : undefined;
    return undefined;
  });
  if (opts?.rootResourceId) {
    (gen1App.aws.fetchRestApiRootResourceId as jest.Mock).mockResolvedValue(opts.rootResourceId);
  }
}

describe('RestApiGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/tmp/test-output';

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
  });

  describe('orchestration', () => {
    it('returns one operation with correct description', async () => {
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App);

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
      const ops = await generator.plan();

      expect(ops).toHaveLength(1);
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toContain('myApi');
    });

    it('contributes namespace import and post-define statement to backend generator on execute', async () => {
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App);

      const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
      const addPostDefineStatementSpy = jest.spyOn(backendGenerator, 'addPostDefineBackendStatement');

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addNamespaceImportSpy).toHaveBeenCalledWith('myApi', './api/myApi/resource');
      expect(addPostDefineStatementSpy).toHaveBeenCalled();
    });
  });

  describe('resource.ts generation (renderer tests)', () => {
    it('renders a basic REST API', async () => {
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        apiId: 'abc123',
        rootResourceId: 'root456',
        paths: {
          '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
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
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        paths: {
          '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
          '/other': { lambdaFunction: 'otherFunc', permissions: { setting: 'open' } },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
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
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        hasAuth: true,
        paths: {
          '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'private' } },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
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
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        hasAuth: false,
        paths: {
          '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'private' } },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      const output = writtenFile('resource.ts');
      expect(output).not.toContain('attachInlinePolicy(gen1myApiPolicy)');
    });

    it('renders auth path policies when permissions.auth is set', async () => {
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        hasAuth: true,
        paths: {
          '/items': {
            lambdaFunction: 'myFunc',
            permissions: { setting: 'private', auth: ['read', 'create'] },
          },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
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
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        hasAuth: true,
        paths: {
          '/admin': {
            lambdaFunction: 'myFunc',
            permissions: {
              groups: { admins: ['read'] },
            },
          },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
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
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        paths: {
          '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
          '/users': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
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
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        paths: {
          '/auth-test': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myApi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      const output = writtenFile('resource.ts');
      expect(output).toContain('authtest');
      expect(output).not.toContain('const auth-test');
    });

    it('sanitizes hyphenated api names in output', async () => {
      const gen1App = createMockGen1App();
      setupRestApiMocks(gen1App, {
        paths: {
          '/items': { lambdaFunction: 'myFunc', permissions: { setting: 'open' } },
        },
      });

      const generator = new RestApiGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'myapi',
        service: 'API Gateway',
        key: 'api:API Gateway',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      const output = writtenFile('resource.ts');
      expect(output).toContain('myapiApi');
    });
  });
});
