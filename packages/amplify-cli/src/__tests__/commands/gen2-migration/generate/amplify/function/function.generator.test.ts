import { FunctionGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/function/function.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate/package.json.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

jest.unmock('fs-extra');

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  JSONUtilities: {
    readJson: jest.fn().mockReturnValue({ dependencies: {}, devDependencies: {} }),
  },
}));

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

function createMockGen1App(): Gen1App {
  return {
    appId: 'd1abc2def3',
    envName: 'main',
    meta: jest.fn(),
    metaOutput: jest.fn(),
    categoryMeta: jest.fn(),
    singleResourceName: jest.fn(),
    resourceMetaOutput: jest.fn(),
    json: jest.fn().mockReturnValue({ Resources: {} }),
    file: jest.fn().mockReturnValue('{}'),
    fileExists: jest.fn().mockReturnValue(false),
    aws: {
      fetchFunctionConfig: jest.fn(),
      fetchFunctionSchedule: jest.fn().mockResolvedValue(undefined),
    },
    clients: {},
  } as unknown as Gen1App;
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
  const resourceName = opts?.resourceName ?? 'myFunc';
  const deployedName = opts?.deployedName ?? `${resourceName}-main-abc`;
  (gen1App.resourceMetaOutput as jest.Mock).mockReturnValue(deployedName);
  (gen1App.categoryMeta as jest.Mock).mockReturnValue(undefined);
  (gen1App.categoryMeta as jest.Mock).mockReturnValue(undefined);
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
      const gen1App = createMockGen1App();
      (gen1App.resourceMetaOutput as jest.Mock).mockImplementation(() => {
        throw new Error("Function 'myFunc' not found in amplify-meta.json");
      });

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
    });
  });

  describe('orchestration', () => {
    it('returns one operation describing the function resource', async () => {
      const gen1App = createMockGen1App();
      setupBasicFunctionMocks(gen1App);

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();

      expect(ops).toHaveLength(1);
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toContain('myFunc');
      expect(descriptions[0]).toContain('resource.ts');
    });

    it('registers namespace import and defineBackend entry on backendGenerator', async () => {
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
      setupBasicFunctionMocks(gen1App, {
        environment: { API_KEY: '/amplify/d1abc2def3/main/some-secret' },
        deployedName: 'myFunc-main-abc',
      });

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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
      const gen1App = createMockGen1App();
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
  });
});
