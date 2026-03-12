import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { FunctionGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/functions/function.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/root-package-json.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate-new/input/gen1-app';

jest.unmock('fs-extra');

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  JSONUtilities: {
    readJson: jest.fn().mockReturnValue({ dependencies: {}, devDependencies: {} }),
  },
}));

function createMockGen1App(): Gen1App {
  return {
    appId: 'd1abc2def3',
    envName: 'main',
    meta: jest.fn(),
    template: jest.fn().mockReturnValue({ Resources: {} }),
    readFile: jest.fn().mockResolvedValue('{}'),
    aws: {
      fetchFunctionConfig: jest.fn(),
      fetchFunctionSchedule: jest.fn().mockResolvedValue(undefined),
    },
    clients: {},
  } as unknown as Gen1App;
}

describe('FunctionGenerator', () => {
  let outputDir: string;
  let backendGenerator: BackendGenerator;
  let packageJsonGenerator: RootPackageJsonGenerator;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'func-gen-test-'));

    backendGenerator = new BackendGenerator(outputDir);
    packageJsonGenerator = new RootPackageJsonGenerator(outputDir);
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('throws when function category is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue(undefined);

    const generator = new FunctionGenerator(
      gen1App,
      backendGenerator,
      undefined,
      undefined,
      packageJsonGenerator,
      outputDir,
      'myFunc',
      'function',
    );

    await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
  });

  it('throws when resource is not in function category', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      otherFunc: { service: 'Lambda', output: { Name: 'otherFunc-main' } },
    });

    const generator = new FunctionGenerator(
      gen1App,
      backendGenerator,
      undefined,
      undefined,
      packageJsonGenerator,
      outputDir,
      'myFunc',
      'function',
    );

    await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
  });

  it('returns one operation when function exists', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
      if (category === 'function') {
        return {
          myFunc: { service: 'Lambda', output: { Name: 'myFunc-main-abc' } },
        };
      }
      return undefined;
    });
    (gen1App.aws.fetchFunctionConfig as jest.Mock).mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });

    const generator = new FunctionGenerator(
      gen1App,
      backendGenerator,
      undefined,
      undefined,
      packageJsonGenerator,
      outputDir,
      'myFunc',
      'function',
    );
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myFunc');
    expect(descriptions[0]).toContain('resource.ts');
  });

  it('writes resource.ts and copies source on execute', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
      if (category === 'function') {
        return {
          myFunc: { service: 'Lambda', output: { Name: 'myFunc-main-abc' } },
        };
      }
      return undefined;
    });
    (gen1App.aws.fetchFunctionConfig as jest.Mock).mockResolvedValue({
      FunctionName: 'myFunc-main-abc',
      Handler: 'index.handler',
      Timeout: 30,
      MemorySize: 128,
      Runtime: 'nodejs18.x',
      Environment: { Variables: {} },
    });

    // copyFunctionSource reads from CWD-relative path
    const funcSrcDir = path.join('amplify', 'backend', 'function', 'myFunc', 'src');
    await fs.mkdir(funcSrcDir, { recursive: true });
    await fs.writeFile(path.join(funcSrcDir, 'index.js'), 'exports.handler = async () => {};');

    const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
    const addPropertySpy = jest.spyOn(backendGenerator, 'addDefineBackendProperty');

    try {
      const generator = new FunctionGenerator(
        gen1App,
        backendGenerator,
        undefined,
        undefined,
        packageJsonGenerator,
        outputDir,
        'myFunc',
        'function',
      );
      const ops = await generator.plan();
      await ops[0].execute();

      // Verify resource.ts was written
      const resourcePath = path.join(outputDir, 'amplify', 'function', 'myFunc', 'resource.ts');
      const content = await fs.readFile(resourcePath, 'utf-8');
      expect(content).toContain('defineFunction');
      expect(content).toContain('myFunc');

      // Verify backend.ts contributions
      expect(addImportSpy).toHaveBeenCalledWith(expect.stringContaining('myFunc'), expect.arrayContaining(['myFunc']));
      expect(addPropertySpy).toHaveBeenCalled();
    } finally {
      // Clean up CWD-relative directory
      await fs.rm(path.join('amplify', 'backend', 'function', 'myFunc'), { recursive: true, force: true });
    }
  });
});
