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
          return { dependencies: { 'my-custom-dep': '^1.0.0' }, devDependencies: { 'my-dev-dep': '^2.0.0' } };
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

const CDK_STACK_CONTENT = `
import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';

export class cdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new cdk.CfnParameter(this, 'env', { type: 'String' });
    const envName = AmplifyHelpers.getProjectInfo().envName;
  }
}
`;

describe('CustomResourceGenerator', () => {
  let backendGenerator: BackendGenerator;
  let packageJsonGenerator: RootPackageJsonGenerator;
  const outputDir = '/fake/output';
  const logger = new SpinningLogger('test');
  const gen1App = { statefulResourceTypes: [...Array.from(DEFAULT_STATEFUL_RESOURCES)] } as unknown as Gen1App;

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
    packageJsonGenerator = new RootPackageJsonGenerator(outputDir);
    mockReadFile.mockResolvedValue(CDK_STACK_CONTENT);
  });

  it('returns one operation describing the custom resource', async () => {
    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myCustom');
  });

  it('copies resource directory and transforms cdk-stack.ts', async () => {
    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(mockCp).toHaveBeenCalledWith(
      expect.stringContaining('myCustom'),
      expect.stringContaining('myCustom'),
      expect.objectContaining({ recursive: true }),
    );
    expect(mockRename).toHaveBeenCalledWith(expect.stringContaining('cdk-stack.ts'), expect.stringContaining('construct.ts'));
  });

  it('contributes namespace import and post-define statement to backend', async () => {
    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addPostDefineStatementSpy = jest.spyOn(backendGenerator, 'addPostDefineBackendStatement');

    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('myCustom', './custom/myCustom/resource');
    expect(addPostDefineStatementSpy).toHaveBeenCalledWith(expect.stringContaining('myCustom.defineMyCustom(backend)'));
  });

  it('removes build artifacts', async () => {
    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(mockRm).toHaveBeenCalled();
    const rmPaths = mockRm.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(rmPaths.some((p: string) => p.includes('build'))).toBe(true);
    expect(rmPaths.some((p: string) => p.includes('node_modules'))).toBe(true);
  });

  it('merges non-excluded dependencies into root package.json', async () => {
    const addDependencySpy = jest.spyOn(packageJsonGenerator, 'addDependency');
    const addDevDependencySpy = jest.spyOn(packageJsonGenerator, 'addDevDependency');

    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addDependencySpy).toHaveBeenCalledWith('my-custom-dep', '^1.0.0');
    expect(addDevDependencySpy).toHaveBeenCalledWith('my-dev-dep', '^2.0.0');
  });

  it('excludes CDK and Amplify helper dependencies', async () => {
    const { JSONUtilities } = jest.requireMock('@aws-amplify/amplify-cli-core');
    JSONUtilities.readJson.mockImplementation((filePath: string) => {
      if (filePath.endsWith('package.json')) {
        return {
          dependencies: { 'aws-cdk-lib': '^2.0.0', '@aws-cdk/aws-sns': '^1.0.0', '@aws-amplify/cli-extensibility-helper': '^3.0.0' },
          devDependencies: { constructs: '^10.0.0', 'aws-cdk': '^2.0.0' },
        };
      }
      if (filePath.endsWith('project-config.json')) {
        return { projectName: 'testProject' };
      }
      return {};
    });

    const addDependencySpy = jest.spyOn(packageJsonGenerator, 'addDependency');
    const addDevDependencySpy = jest.spyOn(packageJsonGenerator, 'addDevDependency');

    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addDependencySpy).not.toHaveBeenCalled();
    expect(addDevDependencySpy).not.toHaveBeenCalled();
  });

  it('throws when cdk-stack.ts cannot be read', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));

    const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom', logger);
    const ops = await generator.plan();
    await expect(ops[0].execute()).rejects.toThrow();
  });
});
