import { CustomResourceGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/custom-resources/custom.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate/package.json.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

jest.unmock('fs-extra');

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  JSONUtilities: {
    readJson: jest.fn().mockReturnValue({ dependencies: { 'aws-cdk-lib': '^2.0.0' }, devDependencies: {} }),
  },
}));

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

function createMockGen1App(): Gen1App {
  return {
    appId: 'd1abc2def3',
    envName: 'main',
    json: jest.fn().mockReturnValue({}),
    fileExists: jest.fn().mockReturnValue(false),
  } as unknown as Gen1App;
}

const CDK_STACK_CONTENT = `
import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';

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

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
    packageJsonGenerator = new RootPackageJsonGenerator(outputDir);

    // Default: readFile returns the cdk-stack content
    mockReadFile.mockResolvedValue(CDK_STACK_CONTENT);
  });

  describe('orchestration', () => {
    it('returns one operation describing the custom resource', async () => {
      const gen1App = createMockGen1App();
      const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom');
      const ops = await generator.plan();

      expect(ops).toHaveLength(1);
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toContain('myCustom');
    });
  });

  describe('execution', () => {
    it('copies resource directory and transforms cdk-stack.ts', async () => {
      const gen1App = createMockGen1App();
      const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom');
      const ops = await generator.plan();
      await ops[0].execute();

      // Verify cp was called for the resource directory
      expect(mockCp).toHaveBeenCalledWith(
        expect.stringContaining('myCustom'),
        expect.stringContaining('myCustom'),
        expect.objectContaining({ recursive: true }),
      );

      // Verify rename was called (cdk-stack.ts -> resource.ts)
      expect(mockRename).toHaveBeenCalledWith(expect.stringContaining('cdk-stack.ts'), expect.stringContaining('resource.ts'));
    });

    it('contributes namespace import and post-define call to backend', async () => {
      const gen1App = createMockGen1App();
      const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
      const addPostDefineBackendCallSpy = jest.spyOn(backendGenerator, 'addPostDefineBackendCall');

      const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom');
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addNamespaceImportSpy).toHaveBeenCalledWith('myCustom', './custom/myCustom/resource');
      expect(addPostDefineBackendCallSpy).toHaveBeenCalledWith('_custom_myCustom', expect.stringContaining('cdkStack'));
    });

    it('removes build artifacts', async () => {
      const gen1App = createMockGen1App();
      const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom');
      const ops = await generator.plan();
      await ops[0].execute();

      // rm should be called for build artifacts
      expect(mockRm).toHaveBeenCalled();
      const rmPaths = mockRm.mock.calls.map((c: unknown[]) => c[0] as string);
      expect(rmPaths.some((p: string) => p.includes('build'))).toBe(true);
      expect(rmPaths.some((p: string) => p.includes('node_modules'))).toBe(true);
    });

    it('merges dependencies into root package.json', async () => {
      const gen1App = createMockGen1App();
      const addDependencySpy = jest.spyOn(packageJsonGenerator, 'addDependency');

      const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom');
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addDependencySpy).toHaveBeenCalledWith('aws-cdk-lib', '^2.0.0');
    });
  });

  describe('error handling', () => {
    it('throws when cdk-stack.ts cannot be read', async () => {
      const gen1App = createMockGen1App();
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));

      const generator = new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, 'myCustom');
      const ops = await generator.plan();
      await expect(ops[0].execute()).rejects.toThrow();
    });
  });
});
