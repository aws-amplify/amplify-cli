import { FunctionGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/function/function.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate/package.json.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/_common/gen1-app';
import { createGen1App } from '../../_helpers/create-gen1-app';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';

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

function createFunctionGenerator(overrides: {
  gen1App: Gen1App;
  backendGenerator: BackendGenerator;
  packageJsonGenerator: RootPackageJsonGenerator;
  outputDir: string;
  resourceName?: string;
}): FunctionGenerator {
  const logger = new SpinningLogger('function');
  return new FunctionGenerator({
    gen1App: overrides.gen1App,
    backendGenerator: overrides.backendGenerator,
    packageJsonGenerator: overrides.packageJsonGenerator,
    outputDir: overrides.outputDir,
    resource: {
      category: 'function',
      resourceName: overrides.resourceName ?? 'myFunc',
      service: 'Lambda',
      key: 'function:Lambda',
    },
    logger,
  });
}

describe('FunctionGenerator', () => {
  let backendGenerator: BackendGenerator;
  let packageJsonGenerator: RootPackageJsonGenerator;
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
    packageJsonGenerator = new RootPackageJsonGenerator(outputDir);
  });

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

  it('returns one operation describing the function resource', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myFunc');
    expect(descriptions[0]).toContain('resource.ts');
  });

  it('registers namespace import and defineBackend entry on backendGenerator', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addDefineBackendEntrySpy = jest.spyOn(backendGenerator, 'addDefineBackendEntry');

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('myFunc', expect.stringContaining('myFunc'));
    expect(addDefineBackendEntrySpy).toHaveBeenCalledWith('myFunc', 'myFunc', 'myFunc');
  });

  it('copies function source files', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    expect(mockCp).toHaveBeenCalledWith(
      expect.stringContaining('myFunc'),
      expect.any(String),
      expect.objectContaining({ recursive: true }),
    );
  });

  it('renders a basic defineFunction with entry point', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 256,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: { DB_HOST: 'localhost', DB_PORT: '5432' } },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: { ENV: 'main' } },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: { API_KEY: '/amplify/d1abc2def3/main/some-secret' } },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);
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

  it('renders environment variables', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: { DB_HOST: 'localhost', DB_PORT: '5432' } },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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

  it('renders rate schedule expression', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue('rate(5 minutes)');

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue('cron(0 12 * * ? *)');

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue('rate(1 hour)');

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue('rate(7 days)');

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
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
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
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
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
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
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
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
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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

  it('renders unmapped auth actions as addToRolePolicy', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      auth: { testAuth: { service: 'Cognito', output: { UserPoolId: 'us-east-1_abc' } } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Resources: {
        AmplifyResourcesPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['cognito-idp:AdminLinkProviderForUser'],
                  Resource: [{ 'Fn::Sub': 'arn:aws:cognito-idp:*:*:userpool/${authTestAuth}' }],
                },
              ],
            },
          },
        },
      },
    });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import { defineFunction } from '@aws-amplify/backend';
      import { aws_iam } from 'aws-cdk-lib';
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
        new aws_iam.Policy(
          backend.myFunc.resources.lambda,
          'UnmappedCognitoActionsPolicy',
          {
            statements: [
              new aws_iam.PolicyStatement({
                actions: ['cognito-idp:AdminLinkProviderForUser'],
                resources: [backend.auth.resources.userPool.userPoolArn],
              }),
            ],
            roles: [backend.myFunc.resources.lambda.role!],
          }
        );
      }
      "
    `);
  });

  it('renders DynamoDB trigger models', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
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
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('testAuthPreSignup-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'testAuthPreSignup-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

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
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myStorageFunc-main-abc');
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myStorageFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);
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
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
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
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    const output = writtenFile('resource.ts');
    expect(output).toContain('KinesisEventSource');
  });

  it('throws for non-nodejs runtime', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'file').mockReturnValue('{}');
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'handler.handler',
      Timeout: 3,
      MemorySize: 128,
      Runtime: 'python3.9',
      Environment: { Variables: {} },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    await expect(generator.plan()).rejects.toThrow("unsupported runtime 'python3.9'");
  });

  it('uses original model name casing from schema for table grants and env vars', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
      api: {
        myApi: { service: 'AppSync' },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Resources: {
        AmplifyResourcesPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['dynamodb:GetItem'], Resource: [{ Ref: 'apiMyApiTable' }] }],
            },
          },
        },
      },
    });
    jest.spyOn(gen1App, 'file').mockImplementation((filePath: string) => {
      if (filePath.includes('build/schema.graphql')) {
        return 'type ModelrandomItemConnection { items: [randomItem] }\ntype ModelMealPlanConnection { items: [MealPlan] }';
      }
      return '{}';
    });
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          API_MYAPI_RANDOMITEMTABLE_NAME: 'randomItem-abc-main',
          API_MYAPI_RANDOMITEMTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/randomItem-abc-main',
          API_MYAPI_MEALPLANTABLE_NAME: 'MealPlan-abc-main',
          API_MYAPI_MEALPLANTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/MealPlan-abc-main',
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    const resourceTs = writtenFile('resource.ts');

    // The table reference should use original model names, not naive capitalization
    expect(resourceTs).toContain('randomItem');
    expect(resourceTs).toContain('MealPlan');
    // Should NOT contain incorrectly cased versions
    expect(resourceTs).not.toContain('Randomitem');
    expect(resourceTs).not.toContain('Mealplan');
  });

  it('falls back to raw schema regex when build/schema.graphql is not available', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
      api: {
        myApi: { service: 'AppSync' },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Resources: {
        AmplifyResourcesPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['dynamodb:GetItem'], Resource: [{ Ref: 'apiMyApiTable' }] }],
            },
          },
        },
      },
    });
    jest.spyOn(gen1App, 'file').mockImplementation((filePath: string) => {
      if (filePath.includes('build/schema.graphql')) {
        throw new Error('File not found');
      }
      if (filePath.includes('schema.graphql')) {
        return 'type randomItem @model { id: ID! }\ntype MealPlan @model { id: ID! }';
      }
      return '{}';
    });
    jest.spyOn(gen1App, 'fileExists').mockImplementation((filePath: string) => {
      return filePath.includes('schema.graphql') && !filePath.includes('build');
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          API_MYAPI_RANDOMITEMTABLE_NAME: 'randomItem-abc-main',
          API_MYAPI_RANDOMITEMTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/randomItem-abc-main',
          API_MYAPI_MEALPLANTABLE_NAME: 'MealPlan-abc-main',
          API_MYAPI_MEALPLANTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/MealPlan-abc-main',
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    const resourceTs = writtenFile('resource.ts');
    expect(resourceTs).toContain('randomItem');
    expect(resourceTs).toContain('MealPlan');
    expect(resourceTs).not.toContain('Randomitem');
    expect(resourceTs).not.toContain('Mealplan');
  });

  it('handles models with multiple directives before @model in raw schema fallback', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
      api: {
        myApi: { service: 'AppSync' },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Resources: {
        AmplifyResourcesPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['dynamodb:GetItem'], Resource: [{ Ref: 'apiMyApiTable' }] }],
            },
          },
        },
      },
    });
    const rawSchema = [
      'type todoItem @auth(rules: [{allow: owner}]) @model { id: ID! title: String! }',
      'type BlogPost @searchable @auth(rules: [{allow: public}]) @model { id: ID! content: String }',
    ].join('\n');
    jest.spyOn(gen1App, 'file').mockImplementation((filePath: string) => {
      if (filePath.includes('build/schema.graphql')) {
        throw new Error('File not found');
      }
      if (filePath.includes('schema.graphql')) {
        return rawSchema;
      }
      return '{}';
    });
    jest.spyOn(gen1App, 'fileExists').mockImplementation((filePath: string) => {
      return filePath.includes('schema.graphql') && !filePath.includes('build');
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          API_MYAPI_TODOITEMTABLE_NAME: 'todoItem-abc-main',
          API_MYAPI_TODOITEMTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/todoItem-abc-main',
          API_MYAPI_BLOGPOSTTABLE_NAME: 'BlogPost-abc-main',
          API_MYAPI_BLOGPOSTTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/BlogPost-abc-main',
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    const resourceTs = writtenFile('resource.ts');
    expect(resourceTs).toContain('todoItem');
    expect(resourceTs).toContain('BlogPost');
    expect(resourceTs).not.toContain('Todoitem');
    expect(resourceTs).not.toContain('Blogpost');
  });

  it('recovers a @model(queries: null) model missing from the build schema by merging the raw schema', async () => {
    // A model declared `@model(queries: null)` emits no ModelXConnection type,
    // so it is absent from build/schema.graphql. It must still be recovered
    // from the raw schema; otherwise it falls through to naive casing — the
    // exact bug this fix targets.
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
      api: {
        myApi: { service: 'AppSync' },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Resources: {
        AmplifyResourcesPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['dynamodb:GetItem'], Resource: [{ Ref: 'apiMyApiTable' }] }],
            },
          },
        },
      },
    });
    jest.spyOn(gen1App, 'file').mockImplementation((filePath: string) => {
      // Build schema only contains the Connection type for the model WITH a
      // list query (blogPost). secretNote (queries: null) is deliberately absent.
      if (filePath.includes('build/schema.graphql')) {
        return 'type ModelblogPostConnection { items: [blogPost] }\ntype blogPost @model { id: ID! }';
      }
      if (filePath.includes('schema.graphql')) {
        return 'type blogPost @model { id: ID! }\ntype secretNote @model(queries: null) { id: ID! }';
      }
      return '{}';
    });
    jest.spyOn(gen1App, 'fileExists').mockImplementation((filePath: string) => {
      return filePath.includes('schema.graphql') && !filePath.includes('build');
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          API_MYAPI_BLOGPOSTTABLE_NAME: 'blogPost-abc-main',
          API_MYAPI_BLOGPOSTTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/blogPost-abc-main',
          API_MYAPI_SECRETNOTETABLE_NAME: 'secretNote-abc-main',
          API_MYAPI_SECRETNOTETABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/secretNote-abc-main',
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    const resourceTs = writtenFile('resource.ts');
    expect(resourceTs).toContain("backend.data.resources.tables['blogPost']");
    // secretNote is only in the raw schema — the merge must recover it.
    expect(resourceTs).toContain("backend.data.resources.tables['secretNote']");
    expect(resourceTs).not.toContain('Secretnote');
  });

  it('reads model names from schema directory when schema.graphql does not exist', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
      api: {
        myApi: { service: 'AppSync' },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({
      Resources: {
        AmplifyResourcesPolicy: {
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyDocument: {
              Statement: [{ Effect: 'Allow', Action: ['dynamodb:GetItem'], Resource: [{ Ref: 'apiMyApiTable' }] }],
            },
          },
        },
      },
    });

    // Create a schema directory with multiple .graphql files inside ccbDir
    const fsExtra = require('fs-extra');
    const schemaDirPath = require('path').join(gen1App.ccbDir, 'api', 'myApi', 'schema');
    fsExtra.mkdirpSync(schemaDirPath);
    fsExtra.writeFileSync(require('path').join(schemaDirPath, 'todo.graphql'), 'type todoItem @model { id: ID! title: String! }');
    fsExtra.writeFileSync(require('path').join(schemaDirPath, 'blog.graphql'), 'type BlogPost @model { id: ID! content: String }');

    jest.spyOn(gen1App, 'file').mockImplementation((filePath: string) => {
      if (filePath.includes('build/schema.graphql')) {
        throw new Error('File not found');
      }
      return require('fs').readFileSync(require('path').join(gen1App.ccbDir, filePath), 'utf8');
    });
    jest.spyOn(gen1App, 'fileExists').mockImplementation((filePath: string) => {
      if (filePath.includes('schema.graphql')) return false;
      return false;
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          API_MYAPI_TODOITEMTABLE_NAME: 'todoItem-abc-main',
          API_MYAPI_TODOITEMTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/todoItem-abc-main',
          API_MYAPI_BLOGPOSTTABLE_NAME: 'BlogPost-abc-main',
          API_MYAPI_BLOGPOSTTABLE_ARN: 'arn:aws:dynamodb:us-east-1:123:table/BlogPost-abc-main',
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    const resourceTs = writtenFile('resource.ts');
    expect(resourceTs).toContain('todoItem');
    expect(resourceTs).toContain('BlogPost');
    expect(resourceTs).not.toContain('Todoitem');
    expect(resourceTs).not.toContain('Blogpost');
  });

  it('returns empty model names gracefully when no API category exists', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      function: {
        myFunc: {
          service: 'Lambda',
          output: { Name: 'myFunc-main-abc', Arn: 'arn:aws:lambda:us-east-1:123:function:myFunc-main-abc' },
        },
      },
    });
    jest.spyOn(gen1App, 'resourceMetaOutput').mockReturnValue('myFunc-main-abc');
    jest.spyOn(gen1App, 'json').mockReturnValue({ Resources: {} });
    jest.spyOn(gen1App, 'fileExists').mockReturnValue(false);
    jest.spyOn(gen1App.aws, 'fetchFunctionConfig').mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          API_MYAPI_SOMETABLE_NAME: 'SomeTable-abc-main',
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchFunctionSchedule').mockResolvedValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
    const ops = await generator.plan();
    await ops[0].execute();

    const resourceTs = writtenFile('resource.ts');
    // Without model names, falls back to naive capitalization: SOME -> 'Some'.
    // Assert the exact generated table reference so this proves the fallback
    // path rather than an incidental 'Some' substring appearing elsewhere.
    expect(resourceTs).toContain("backend.data.resources.tables['Some']");
  });
});
