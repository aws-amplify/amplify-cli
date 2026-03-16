import ts from 'typescript';
import { FunctionGenerator } from '../../../../../../commands/gen2-migration/generate-new/amplify/function/function.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate-new/amplify/backend.generator';
import { RootPackageJsonGenerator } from '../../../../../../commands/gen2-migration/generate-new/package.json.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate-new/_infra/gen1-app';
import { RenderDefineFunctionOptions } from '../../../../../../commands/gen2-migration/generate-new/amplify/function/function.renderer';

jest.unmock('fs-extra');

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  JSONUtilities: {
    readJson: jest.fn().mockReturnValue({ dependencies: {}, devDependencies: {} }),
  },
}));

const mockRender = jest.fn().mockReturnValue(ts.factory.createNodeArray([]));
jest.mock('../../../../../../commands/gen2-migration/generate-new/amplify/function/function.renderer', () => {
  const actual = jest.requireActual('../../../../../../commands/gen2-migration/generate-new/amplify/function/function.renderer');
  return {
    ...actual,
    FunctionRenderer: jest.fn().mockImplementation(() => ({
      render: mockRender,
    })),
  };
});

const mockPrintNodes = jest.fn().mockReturnValue('/* generated */');
jest.mock('../../../../../../commands/gen2-migration/generate-new/_infra/ts', () => {
  const actual = jest.requireActual('../../../../../../commands/gen2-migration/generate-new/_infra/ts');
  const mockTS: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(actual.TS)) {
    mockTS[key] = actual.TS[key];
  }
  mockTS.printNodes = (...args: unknown[]) => mockPrintNodes(...args);
  return { ...actual, TS: mockTS };
});

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
const mockCp = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  cp: (...args: unknown[]) => mockCp(...args),
}));

function createMockGen1App(): Gen1App {
  return {
    appId: 'd1abc2def3',
    envName: 'main',
    meta: jest.fn(),
    json: jest.fn().mockReturnValue({ Resources: {} }),
    file: jest.fn().mockReturnValue('{}'),
    singleResourceName: jest.fn(),
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
}): FunctionGenerator {
  return new FunctionGenerator({
    gen1App: overrides.gen1App,
    backendGenerator: overrides.backendGenerator,
    packageJsonGenerator: overrides.packageJsonGenerator,
    outputDir: overrides.outputDir,
    resourceName: overrides.resourceName ?? 'myFunc',
    category: 'function',
  });
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

  it('throws when function category is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue(undefined);

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });

    await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
  });

  it('throws when resource is not in function category', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      otherFunc: { service: 'Lambda', output: { Name: 'otherFunc-main' } },
    });

    const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });

    await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
  });

  describe('on successful plan and execute', () => {
    let gen1App: Gen1App;

    beforeEach(() => {
      gen1App = createMockGen1App();
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
    });

    it('returns one operation describing the function resource', async () => {
      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();

      expect(ops).toHaveLength(1);
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toContain('myFunc');
      expect(descriptions[0]).toContain('resource.ts');
    });

    it('calls renderer.render with resolved function config', async () => {
      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(mockRender).toHaveBeenCalledTimes(1);
      const renderOpts: RenderDefineFunctionOptions = mockRender.mock.calls[0][0];
      expect(renderOpts.resourceName).toBe('myFunc');
      expect(renderOpts.entry).toBe('./index.js');
      expect(renderOpts.name).toBe('myFunc-main-abc');
      expect(renderOpts.timeoutSeconds).toBe(30);
      expect(renderOpts.memoryMB).toBe(128);
      expect(renderOpts.runtime).toBe('nodejs18.x');
    });

    it('writes renderer output to the function resource directory', async () => {
      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(mockPrintNodes).toHaveBeenCalledWith(mockRender.mock.results[0].value);
      expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('resource.ts'), '/* generated */', 'utf-8');
    });

    it('registers import and defineBackend property on backendGenerator', async () => {
      const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
      const addPropertySpy = jest.spyOn(backendGenerator, 'addDefineBackendProperty');

      const generator = createFunctionGenerator({ gen1App, backendGenerator, packageJsonGenerator, outputDir });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addImportSpy).toHaveBeenCalledWith(expect.stringContaining('myFunc'), expect.arrayContaining(['myFunc']));
      expect(addPropertySpy).toHaveBeenCalled();
    });

    it('copies function source files', async () => {
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
});
