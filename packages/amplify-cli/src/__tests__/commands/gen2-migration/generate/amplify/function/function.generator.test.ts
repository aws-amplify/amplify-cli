import { FunctionGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/function/function.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate/package.json.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { createGen1App } from '../../_helpers/create-gen1-app';

jest.unmock('fs-extra');

jest.mock('@aws-amplify/amplify-cli-core', () => {
  const actual = jest.requireActual('@aws-amplify/amplify-cli-core');
  return {
    ...actual,
    JSONUtilities: {
      ...actual.JSONUtilities,
      readJson: jest.fn().mockImplementation((filePath: string, opts?: unknown) => {
        if (typeof filePath === 'string' && filePath.endsWith('package.json')) {
          return { dependencies: {}, devDependencies: {} };
        }
        return actual.JSONUtilities.readJson(filePath, opts);
      }),
    },
  };
});

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
const mockCp = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  cp: (...args: unknown[]) => mockCp(...args),
}));

function writtenFile(suffix: string): string {
  const call = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith(suffix));
  if (!call) throw new Error(`No writeFile call ending with '${suffix}'`);
  return call[1] as string;
}

/** Minimal amplify-meta for a function resource. */
function functionMeta(resourceName: string, deployedName: string): Record<string, unknown> {
  return {
    providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
    function: {
      [resourceName]: {
        service: 'Lambda',
        output: { Name: deployedName, Arn: `arn:aws:lambda:us-east-1:123:function:${deployedName}` },
      },
    },
  };
}

function createFunctionGenerator(overrides: {
  gen1App: Gen1App;
  backendGenerator: BackendGenerator;
  packageJsonGenerator: RootPackageJsonGenerator;
  outputDir: string;
  resourceName?: string;
  category?: string;
}): FunctionGenerator {
  return new FunctionGenerator({
    gen1App: overrides.gen1App,
    backendGenerator: overrides.backendGenerator,
    packageJsonGenerator: overrides.packageJsonGenerator,
    outputDir: overrides.outputDir,
    resource: {
      category: overrides.category ?? 'function',
      resourceName: overrides.resourceName ?? 'myFunc',
      service: 'Lambda',
      key: 'function:Lambda',
    },
    category: overrides.category ?? 'function',
  });
}

/** Sets up Gen1App mocks for a basic successful function plan(). */
function setupBasicFunctionMocks(
  gen1App: Gen1App,
  opts?: {
    resourceName?: string;
    deployedName?: string;
    timeout?: number;
    memorySize?: number;
    runtime?: string;
    handler?: string;
    environment?: Record<string, string>;
    schedule?: string;
  },
): void {
  const deployedName = opts?.deployedName ?? `${opts?.resourceName ?? 'myFunc'}-main-abc`;
  jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue(deployedName);
  jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
  jest.spyOn(gen1App, 'file').mockReturnValue('{}');
  jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
  (gen1App.aws.fetchFunctionConfig as jest.Mock).mockResolvedValue({
    FunctionName: deployedName,
    Handler: opts?.handler ?? 'index.handler',
    Timeout: opts?.timeout ?? 3,
    MemorySize: opts?.memorySize ?? 128,
    Runtime: opts?.runtime ?? 'nodejs18.x',
    Environment: { Variables: opts?.environment ?? {} },
  });
  if (opts?.schedule) {
    (gen1App.aws.fetchFunctionSchedule as jest.Mock).mockResolvedValue(opts.schedule);
  }
}

describe('FunctionGenerator', () => {
  let backendGenerator: BackendGenerator;
  let packageJsonGenerator: RootPackageJsonGenerator;
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
    packageJsonGenerator = new RootPackageJsonGenerator(outputDir);
  });

  describe('error handling', () => {
    it('throws when function is not found', async () => {
      const gen1App = await createGen1App({
        providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
        function: {
          myFunc: {
            service: 'Lambda',
            output: {
              /* no Name */
            },
          },
        },
      });
      jest.spyOn(gen1App, 'resourceMetaOutput').mockImplementation(() => {
        throw new Error("Function 'myFunc' not found in amplify-meta.json");
      });
      jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
      jest.spyOn(gen1App, 'file').mockReturnValue('{}');
      jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
    });
  });

  describe('orchestration', () => {
    it('returns one operation describing the function resource', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App);

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();

      expect(ops).toHaveLength(1);
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toContain('myFunc');
      expect(descriptions[0]).toContain('resource.ts');
    });

    it('registers namespace import and defineBackend entry on backendGenerator', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App);

      const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
      const addDefineBackendEntrySpy = jest.spyOn(backendGenerator, 'addDefineBackendEntry');

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addNamespaceImportSpy).toHaveBeenCalledWith('myFunc', expect.stringContaining('myFunc'));
      expect(addDefineBackendEntrySpy).toHaveBeenCalledWith('myFunc', 'myFunc', 'myFunc');
    });

    it('copies function source files', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App);

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(mockCp).toHaveBeenCalledWith(
        expect.stringContaining('myFunc'),
        expect.any(String),
        expect.objectContaining({ recursive: true }),
      );
    });
  });

  describe('resource.ts generation (renderer tests)', () => {
    it('renders a basic defineFunction with entry point', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { deployedName: 'myFunc-main-abc' });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders timeout and memory', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { timeout: 30, memorySize: 256, deployedName: 'myFunc-main-abc' });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 30,
          memoryMB: 256,
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders environment variables', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, {
        environment: { DB_HOST: 'localhost', DB_PORT: '5432' },
        deployedName: 'myFunc-main-abc',
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          environment: { DB_HOST: 'localhost', DB_PORT: '5432' },
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders ENV variable as branch name template', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, {
        environment: { ENV: 'main' },
        deployedName: 'myFunc-main-abc',
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          environment: { ENV: \`\${branchName}\` },
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders API_KEY as secret when it matches SSM pattern', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, {
        environment: { API_KEY: '/amplify/d1abc2def3/main/some-secret' },
        deployedName: 'myFunc-main-abc',
      });
      // Override appId to match the SSM pattern
      (gen1App as any)._appId = 'd1abc2def3';
      Object.defineProperty(gen1App, 'appId', { get: () => 'd1abc2def3' });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction, secret } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          environment: { API_KEY: secret('API_KEY') },
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders nodejs runtime as a number', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { runtime: 'nodejs18.x', deployedName: 'myFunc-main-abc' });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders rate schedule expression', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { schedule: 'rate(5 minutes)', deployedName: 'myFunc-main-abc' });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
          schedule: 'every 5m',
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders cron schedule expression', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { schedule: 'cron(0 12 * * ? *)', deployedName: 'myFunc-main-abc' });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
          schedule: '0 12 * * ? *',
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders rate with hours unit', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { schedule: 'rate(1 hour)', deployedName: 'myFunc-main-abc' });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
          schedule: 'every 1h',
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders rate with days unit', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { schedule: 'rate(7 days)', deployedName: 'myFunc-main-abc' });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
          schedule: 'every 7d',
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
        }
        "
      `);
    });

    it('renders DynamoDB actions in escape hatches', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { deployedName: 'myFunc-main-abc' });
      jest.spyOn(gen1App, 'json').mockReturnValue({
        Resources: {
          AmplifyResourcesPolicy: {
            Type: 'AWS::IAM::Policy',
            Properties: {
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['dynamodb:GetItem', 'dynamodb:PutItem'],
                    Resource: [{ 'Fn::Sub': 'arn:aws:dynamodb:*:*:table/Todo-${api}' }],
                  },
                ],
              },
            },
          },
        },
      });
      (gen1App.aws.fetchFunctionConfig as jest.Mock).mockResolvedValue({
        FunctionName: 'myFunc-main-abc',
        Handler: 'index.handler',
        Timeout: 3,
        MemorySize: 128,
        Runtime: 'nodejs18.x',
        Environment: {
          Variables: {
            API_MYAPI_TODOTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/Todo',
            API_MYAPI_TODOTABLE_NAME: 'Todo-abc',
          },
        },
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
          backend.myFunc.addEnvironment(
            'API_MYAPI_TODOTABLE_ARN',
            backend.data.resources.tables['Todo'].tableArn
          );
          backend.myFunc.addEnvironment(
            'API_MYAPI_TODOTABLE_NAME',
            backend.data.resources.tables['Todo'].tableName
          );
          backend.data.resources.tables['Todo'].grant(
            backend.myFunc.resources.lambda,
            'dynamodb:GetItem',
            'dynamodb:PutItem'
          );
        }
        "
      `);
    });

    it('renders Kinesis actions in escape hatches', async () => {
      const gen1App = await createGen1App({
        providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
        function: {
          myFunc: { service: 'Lambda', output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' } },
        },
        analytics: { myStream: { service: 'Kinesis' } },
      });
      setupBasicFunctionMocks(gen1App, { deployedName: 'myFunc-main-abc' });
      jest.spyOn(gen1App, 'json').mockReturnValue({
        Resources: {
          AmplifyResourcesPolicy: {
            Type: 'AWS::IAM::Policy',
            Properties: {
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['kinesis:PutRecord', 'kinesis:PutRecords'],
                    Resource: [{ Ref: 'analyticsMyStreamkinesisStreamArn' }],
                  },
                ],
              },
            },
          },
        },
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import { aws_iam } from 'aws-cdk-lib';
        import type { Backend } from '../../backend';
        import type { MyStream } from '../../analytics/mystream-construct';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend, analytics: MyStream) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
          backend.myFunc.resources.lambda.addToRolePolicy(
            new aws_iam.PolicyStatement({
              actions: ['kinesis:PutRecord', 'kinesis:PutRecords'],
              resources: [analytics.kinesisStreamArn],
            })
          );
        }
        "
      `);
    });

    it('renders GraphQL API permissions in escape hatches', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { deployedName: 'myFunc-main-abc' });
      jest.spyOn(gen1App, 'json').mockReturnValue({
        Resources: {
          AmplifyResourcesPolicy: {
            Type: 'AWS::IAM::Policy',
            Properties: {
              PolicyDocument: {
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['appsync:GraphQL'],
                    Resource: [
                      { 'Fn::Sub': 'arn:aws:appsync:*:*:apis/*/types/Mutation/*' },
                      { 'Fn::Sub': 'arn:aws:appsync:*:*:apis/*/types/Query/*' },
                    ],
                  },
                ],
              },
            },
          },
        },
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
          backend.data.resources.graphqlApi.grantMutation(
            backend.myFunc.resources.lambda
          );
          backend.data.resources.graphqlApi.grantQuery(backend.myFunc.resources.lambda);
        }
        "
      `);
    });

    it('renders DynamoDB trigger models', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      setupBasicFunctionMocks(gen1App, { deployedName: 'myFunc-main-abc' });
      jest.spyOn(gen1App, 'json').mockReturnValue({
        Resources: {
          EventSourceMapping: {
            Type: 'AWS::Lambda::EventSourceMapping',
            Properties: {
              EventSourceArn: {
                'Fn::ImportValue': {
                  'Fn::Sub': '${api}:GetAtt:TodoTable:StreamArn',
                },
              },
              FunctionName: { Ref: 'LambdaFunction' },
            },
          },
        },
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { defineFunction } from '@aws-amplify/backend';
        import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
        import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
        import type { Backend } from '../../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export const myFunc = defineFunction({
          entry: './index.js',
          name: \`myFunc-\${branchName}\`,
          timeoutSeconds: 3,
          memoryMB: 128,
          runtime: 18,
        });

        export function applyEscapeHatches(backend: Backend) {
          backend.myFunc.resources.cfnResources.cfnFunction.functionName = \`myFunc-\${branchName}\`;
          for (const model of ['Todo']) {
            const table = backend.data.resources.tables[model];
            backend.myFunc.resources.lambda.addEventSource(
              new DynamoEventSource(table, {
                startingPosition: StartingPosition.LATEST,
              })
            );
            table.grantStreamRead(backend.myFunc.resources.lambda.role!);
            table.grantTableListStreams(backend.myFunc.resources.lambda.role!);
          }
        }
        "
      `);
    });
  });

  describe('cross-category wiring', () => {
    it('contributes auth trigger when category is auth', async () => {
      const gen1App = await createGen1App({
        providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
        auth: { testAuth: { service: 'Cognito' } },
        function: {
          testAuthPreSignup: {
            service: 'Lambda',
            output: { Name: 'testAuthPreSignup-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:testAuthPreSignup-main-abc' },
          },
        },
      });
      setupBasicFunctionMocks(gen1App, { resourceName: 'testAuthPreSignup', deployedName: 'testAuthPreSignup-main-abc' });
      jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);

      const mockAuthGenerator = {
        addTrigger: jest.fn(),
        addFunctionAuthAccess: jest.fn(),
      };

      const generator = createFunctionGenerator({
        gen1App,
        backendGenerator,
        packageJsonGenerator,
        outputDir,
        resourceName: 'testAuthPreSignup',
        category: 'auth',
      });
      generator.setAuthGenerator(mockAuthGenerator as any);

      const ops = await generator.plan();
      await ops[0].execute();

      expect(mockAuthGenerator.addTrigger).toHaveBeenCalledWith({
        event: 'preSignUp',
        resourceName: 'testAuthPreSignup',
      });
    });

    it('contributes storage trigger when category is storage and S3 trigger exists', async () => {
      const gen1App = await createGen1App({
        providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
        storage: { myBucket: { service: 'S3' } },
        function: {
          myStorageFunc: {
            service: 'Lambda',
            output: { Name: 'myStorageFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myStorageFunc-main-abc' },
          },
        },
      });
      setupBasicFunctionMocks(gen1App, { resourceName: 'myStorageFunc', deployedName: 'myStorageFunc-main-abc' });
      // The storage template with S3 trigger
      jest.spyOn(gen1App, 'json').mockImplementation((templatePath: string) => {
        if (templatePath.includes('storage/')) {
          return {
            Resources: {
              S3Bucket: {
                Properties: {
                  NotificationConfiguration: {
                    LambdaConfigurations: [
                      {
                        Function: { Ref: 'functionmyStorageFuncLambdaRef' },
                        Event: 's3:ObjectCreated:*',
                      },
                    ],
                  },
                },
              },
            },
          };
        }
        return { Resources: {} };
      });

      const mockS3Generator = {
        addTrigger: jest.fn(),
        addFunctionAccess: jest.fn(),
      };

      const generator = createFunctionGenerator({
        gen1App,
        backendGenerator,
        packageJsonGenerator,
        outputDir,
        resourceName: 'myStorageFunc',
        category: 'storage',
      });
      generator.setS3Generator(mockS3Generator as any);

      const ops = await generator.plan();
      await ops[0].execute();

      expect(mockS3Generator.addTrigger).toHaveBeenCalledWith('onUpload', 'myStorageFunc');
    });

    it('detects Kinesis trigger from event source mapping', async () => {
      const gen1App = await createGen1App({
        providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
        function: {
          myFunc: { service: 'Lambda', output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' } },
        },
        analytics: { myStream: { service: 'Kinesis' } },
      });
      setupBasicFunctionMocks(gen1App, { deployedName: 'myFunc-main-abc' });
      jest.spyOn(gen1App, 'json').mockReturnValue({
        Resources: {
          KinesisEventSourceMapping: {
            Type: 'AWS::Lambda::EventSourceMapping',
            Properties: {
              EventSourceArn: { Ref: 'analyticsMyStreamkinesisStreamArn' },
              FunctionName: { Ref: 'LambdaFunction' },
            },
          },
        },
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      const output = writtenFile('resource.ts');
      expect(output).toContain('KinesisEventSource');
    });

    it('throws for non-nodejs runtime', async () => {
      const gen1App = await createGen1App(functionMeta('myFunc', 'myFunc-main-abc'));
      jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
      jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
      jest.spyOn(gen1App, 'file').mockReturnValue('{}');
      jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
      (gen1App.aws.fetchFunctionConfig as jest.Mock).mockResolvedValue({
        FunctionName: 'myFunc-main-abc',
        Handler: 'handler.handler',
        Timeout: 3,
        MemorySize: 128,
        Runtime: 'python3.9',
        Environment: { Variables: {} },
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      await expect(generator.plan()).rejects.toThrow("unsupported runtime 'python3.9'");
    });
  });
});
