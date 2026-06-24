import { CustomResourceGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/custom-resources/custom.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate/package.json.generator';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';
import { Gen1App } from '../../../../../../commands/gen2-migration/_common/gen1-app';
import { DEFAULT_STATEFUL_RESOURCES } from '../../../../../../commands/gen2-migration/_common/resource-types';

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
        if (typeof filePath === 'string' && filePath.endsWith('project-config.json')) {
          return { projectName: 'testProject' };
        }
        return actual.JSONUtilities.readJson(filePath, opts);
      }),
    },
  };
});

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
const mockCp = jest.fn().mockResolvedValue(undefined);
const mockRm = jest.fn().mockResolvedValue(undefined);
const mockReadFile = jest.fn();
const mockReaddir = jest.fn().mockResolvedValue([]);
const mockRename = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  cp: (...args: unknown[]) => mockCp(...args),
  rm: (...args: unknown[]) => mockRm(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
  readdir: (...args: unknown[]) => mockReaddir(...args),
  rename: (...args: unknown[]) => mockRename(...args),
}));

const CDK_STACK_WITH_DEPS = `
import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const dependencies = AmplifyHelpers.addResourceDependency(this, props, 'myCustom', [
      { category: 'auth', resourceName: 'myAuth' }
    ]);
    const poolId = cdk.Fn.ref(dependencies.auth.myAuth.UserPoolId);
  }
}
`;

// Customer migrationgen2 pattern: bare `addResourceDependency` named import assigned
// to a typed `dependencies` variable. Previously undetected -> TS2663 dependencies undefined.
const CDK_STACK_BARE_IMPORT_DEPS = `
import * as cdk from 'aws-cdk-lib';
import { type AmplifyResourceProps, addResourceDependency } from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AmplifyResourceProps) {
    super(scope, id, props);
    const dependencies: AmplifyDependentResourcesAttributes = addResourceDependency(this, props, 'myCustom', [
      { category: 'function', resourceName: 'myFunc' },
      { category: 'auth', resourceName: 'myAuth' }
    ]);
    const fnName = cdk.Fn.ref(dependencies.function.myFunc.Name);
    const poolArn = cdk.Fn.ref(dependencies.auth.myAuth.UserPoolArn);
  }
}
`;

const CDK_STACK_NO_DEPS = `
import * as cdk from 'aws-cdk-lib';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
`;

/**
 * Verifies that the constructor parameter count in construct.ts always matches
 * the argument count in the `new <Class>(...)` call in resource.ts.
 */
describe('CustomResourceGenerator dependency consistency', () => {
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');
  const gen1App = { statefulResourceTypes: [...Array.from(DEFAULT_STATEFUL_RESOURCES)] } as unknown as Gen1App;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('construct.ts ctor params == resource.ts new call args when resource has dependencies', async () => {
    mockReadFile.mockResolvedValue(CDK_STACK_WITH_DEPS);

    const backendGenerator = new BackendGenerator(outputDir, logger);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);
    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    // Find the construct content (written to cdk-stack.ts before rename)
    const constructCall = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith('cdk-stack.ts'));
    expect(constructCall).toBeDefined();
    const constructContent = constructCall![1] as string;

    // Find the resource.ts content
    const resourceCall = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith('resource.ts'));
    expect(resourceCall).toBeDefined();
    const resourceContent = resourceCall![1] as string;

    // Count constructor params
    const ctorMatch = constructContent.match(/constructor\(([\s\S]*?)\)\s*\{/);
    expect(ctorMatch).toBeDefined();
    const ctorParams = ctorMatch![1].split(',').filter((p: string) => p.trim()).length;

    // Count args in `new MyCustom(...)` — handle nested parens like backend.createStack('...')
    const newCallMatch = resourceContent.match(/new MyCustom\(([\s\S]*?)\);/);
    expect(newCallMatch).toBeDefined();
    const newCallArgs = newCallMatch![1].split(/,(?![^(]*\))/).filter((a: string) => a.trim()).length;

    expect(ctorParams).toBe(3); // scope, id, backend
    expect(newCallArgs).toBe(ctorParams);
  });

  it('rewrites bare addResourceDependency refs to backend.* and adds backend param (customer pattern)', async () => {
    mockReadFile.mockResolvedValue(CDK_STACK_BARE_IMPORT_DEPS);

    const backendGenerator = new BackendGenerator(outputDir, logger);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);
    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    const constructCall = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith('cdk-stack.ts'));
    expect(constructCall).toBeDefined();
    const constructContent = constructCall![1] as string;

    const resourceCall = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith('resource.ts'));
    expect(resourceCall).toBeDefined();
    const resourceContent = resourceCall![1] as string;

    // backend constructor param emitted and dependency refs rewritten to backend.*
    expect(constructContent).toContain('backend: Backend');
    expect(constructContent).toContain('backend.functions.myFunc.resources.lambda.functionName');
    expect(constructContent).toContain('backend.auth.resources.userPool.userPoolArn');

    // No leftover Gen1 dependency artifacts that would cause TS2663
    expect(constructContent).not.toContain('addResourceDependency');
    expect(constructContent).not.toContain('dependencies.');
    expect(constructContent).not.toContain('Fn.ref');
    expect(constructContent).not.toContain('AmplifyDependentResourcesAttributes');

    // ctor params and resource.ts new call args stay consistent (scope, id, backend)
    const ctorMatch = constructContent.match(/constructor\(([\s\S]*?)\)\s*\{/);
    expect(ctorMatch).toBeDefined();
    const ctorParams = ctorMatch![1].split(',').filter((p: string) => p.trim()).length;

    const newCallMatch = resourceContent.match(/new MyCustom\(([\s\S]*?)\);/);
    expect(newCallMatch).toBeDefined();
    const newCallArgs = newCallMatch![1].split(/,(?![^(]*\))/).filter((a: string) => a.trim()).length;

    expect(ctorParams).toBe(3); // scope, id, backend
    expect(newCallArgs).toBe(ctorParams);
  });

  it('construct.ts ctor params == resource.ts new call args when no dependencies', async () => {
    mockReadFile.mockResolvedValue(CDK_STACK_NO_DEPS);

    const backendGenerator = new BackendGenerator(outputDir, logger);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);
    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'noDep', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    const constructCall = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith('cdk-stack.ts'));
    expect(constructCall).toBeDefined();
    const constructContent = constructCall![1] as string;

    const resourceCall = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith('resource.ts'));
    expect(resourceCall).toBeDefined();
    const resourceContent = resourceCall![1] as string;

    const ctorMatch = constructContent.match(/constructor\(([\s\S]*?)\)\s*\{/);
    expect(ctorMatch).toBeDefined();
    const ctorParams = ctorMatch![1].split(',').filter((p: string) => p.trim()).length;

    const newCallMatch = resourceContent.match(/new NoDep\(([\s\S]*?)\);/);
    expect(newCallMatch).toBeDefined();
    const newCallArgs = newCallMatch![1].split(/,(?![^(]*\))/).filter((a: string) => a.trim()).length;

    expect(ctorParams).toBe(2); // scope, id
    expect(newCallArgs).toBe(ctorParams);
  });
});
