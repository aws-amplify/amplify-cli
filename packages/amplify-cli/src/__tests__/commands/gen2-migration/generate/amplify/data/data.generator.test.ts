import ts from 'typescript';
import { DataGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { DataRenderer, RenderDefineDataOptions } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.renderer';

jest.unmock('fs-extra');

const mockRender = jest.fn().mockReturnValue(ts.factory.createNodeArray([]));
jest.mock('../../../../../../commands/gen2-migration/generate/amplify/data/data.renderer', () => ({
  DataRenderer: jest.fn().mockImplementation(() => ({ render: mockRender })),
}));

const mockPrintNodes = jest.fn().mockReturnValue('/* generated */');
jest.mock('../../../../../../commands/gen2-migration/generate/_infra/ts', () => {
  const actual = jest.requireActual('../../../../../../commands/gen2-migration/generate/_infra/ts');
  const mockTS: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(actual.TS)) {
    mockTS[key] = actual.TS[key];
  }
  mockTS.printNodes = (...args: unknown[]) => mockPrintNodes(...args);
  return { ...actual, TS: mockTS };
});

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

function createMockGen1App(overrides?: Record<string, unknown>): Gen1App {
  return {
    envName: 'main',
    ccbDir: '/tmp/ccb',
    meta: jest.fn(),
    metaOutput: jest.fn(),
    singleResourceName: jest.fn().mockReturnValue('myApi'),
    file: jest.fn(),
    aws: {
      fetchGraphqlApi: jest.fn(),
    },
    ...overrides,
  } as unknown as Gen1App;
}

describe('DataGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
  });

  it('throws when api category is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.singleResourceName as jest.Mock).mockImplementation(() => {
      throw new Error("Category 'api' not found");
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
      category: 'api',
      resourceName: 'testApi',
      service: 'AppSync',
      key: 'api:AppSync',
    });

    await expect(generator.plan()).rejects.toThrow("Category 'api' not found");
  });

  it('throws when no AppSync API exists', async () => {
    const gen1App = createMockGen1App();
    (gen1App.singleResourceName as jest.Mock).mockImplementation(() => {
      throw new Error("Expected exactly one 'AppSync' resource");
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
      category: 'api',
      resourceName: 'testApi',
      service: 'AppSync',
      key: 'api:AppSync',
    });

    await expect(generator.plan()).rejects.toThrow("Expected exactly one 'AppSync' resource");
  });

  it('throws when AppSync API has no GraphQLAPIIdOutput', async () => {
    const gen1App = createMockGen1App();
    (gen1App.file as jest.Mock).mockReturnValue('type Todo @model { id: ID! }');
    (gen1App.metaOutput as jest.Mock).mockImplementation(() => {
      throw new Error('no GraphQLAPIIdOutput');
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
      category: 'api',
      resourceName: 'testApi',
      service: 'AppSync',
      key: 'api:AppSync',
    });

    await expect(generator.plan()).rejects.toThrow('no GraphQLAPIIdOutput');
  });

  it('throws when AppSync API is not found via SDK', async () => {
    const gen1App = createMockGen1App();
    (gen1App.file as jest.Mock).mockReturnValue('type Todo @model { id: ID! }');
    (gen1App.metaOutput as jest.Mock).mockReturnValue('api-123');
    (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue(undefined);

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
      category: 'api',
      resourceName: 'testApi',
      service: 'AppSync',
      key: 'api:AppSync',
    });

    await expect(generator.plan()).rejects.toThrow("AppSync API 'api-123' not found");
  });

  it('constructs DataRenderer with envName', () => {
    const gen1App = createMockGen1App();
    new DataGenerator(gen1App, backendGenerator, outputDir, {
      category: 'api',
      resourceName: 'testApi',
      service: 'AppSync',
      key: 'api:AppSync',
    });

    expect(DataRenderer).toHaveBeenCalledWith('main');
  });

  describe('on successful plan and execute', () => {
    let gen1App: Gen1App;

    beforeEach(() => {
      gen1App = createMockGen1App();
      (gen1App.file as jest.Mock).mockReturnValue('type Todo @model { id: ID! }');
      (gen1App.metaOutput as jest.Mock).mockImplementation((_cat: string, _res: string, key: string) => {
        if (key === 'GraphQLAPIIdOutput') return 'api-123';
        return { defaultAuthentication: { authenticationType: 'API_KEY' } };
      });
      (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
        if (category === 'auth') return undefined;
        return undefined;
      });
      (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue({
        apiId: 'api-123',
        name: 'myApi',
        additionalAuthenticationProviders: [],
      });
    });

    it('returns one operation describing data/resource.ts', async () => {
      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();

      expect(ops).toHaveLength(1);
      const descriptions = await ops[0].describe();
      expect(descriptions[0]).toContain('data/resource.ts');
    });

    it('calls renderer.render with schema, tableMappings, authorizationModes, and logging', async () => {
      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(mockRender).toHaveBeenCalledTimes(1);
      const renderOpts: RenderDefineDataOptions = mockRender.mock.calls[0][0];
      expect(renderOpts.schema).toBe('type Todo @model { id: ID! }');
      expect(renderOpts.tableMappings).toEqual({ Todo: 'Todo-api-123-main' });
      expect(renderOpts.authorizationModes).toEqual({
        defaultAuthentication: { authenticationType: 'API_KEY' },
      });
    });

    it('passes logging config from graphqlApi to renderer', async () => {
      (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue({
        apiId: 'api-123',
        name: 'myApi',
        additionalAuthenticationProviders: [],
        logConfig: { fieldLogLevel: 'ERROR', excludeVerboseContent: true },
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      const renderOpts: RenderDefineDataOptions = mockRender.mock.calls[0][0];
      expect(renderOpts.logging).toEqual({ fieldLogLevel: 'error', excludeVerboseContent: true });
    });

    it('passes undefined logging when logConfig has NONE fieldLogLevel', async () => {
      (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue({
        apiId: 'api-123',
        name: 'myApi',
        additionalAuthenticationProviders: [],
        logConfig: { fieldLogLevel: 'NONE' },
      });

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      const renderOpts: RenderDefineDataOptions = mockRender.mock.calls[0][0];
      expect(renderOpts.logging).toBeUndefined();
    });

    it('writes renderer output to amplify/data/resource.ts via printNodes', async () => {
      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(mockPrintNodes).toHaveBeenCalledWith(mockRender.mock.results[0].value);
      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('data'), { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('resource.ts'), '/* generated */', 'utf-8');
    });

    it('registers namespace import and defineBackend entry on backendGenerator', async () => {
      const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
      const addDefineBackendEntrySpy = jest.spyOn(backendGenerator, 'addDefineBackendEntry');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addNamespaceImportSpy).toHaveBeenCalledWith('data', './data/resource');
      expect(addDefineBackendEntrySpy).toHaveBeenCalledWith('data', 'data', 'data');
    });

    it('contributes applyEscapeHatches call when auth exists and additional providers present', async () => {
      (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
        if (category === 'auth') return { myAuth: {} };
        return undefined;
      });
      (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue({
        apiId: 'api-123',
        name: 'myApi',
        additionalAuthenticationProviders: [{ authenticationType: 'AMAZON_COGNITO_USER_POOLS', userPoolConfig: { userPoolId: 'pool-1' } }],
      });

      const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addApplyEscapeHatchesCallSpy).toHaveBeenCalledWith('data');
    });

    it('does not contribute applyEscapeHatches call when auth category is absent', async () => {
      (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue({
        apiId: 'api-123',
        name: 'myApi',
        additionalAuthenticationProviders: [{ authenticationType: 'AMAZON_COGNITO_USER_POOLS' }],
      });

      const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addApplyEscapeHatchesCallSpy).not.toHaveBeenCalled();
    });

    it('does not contribute applyEscapeHatches call when additional providers list is empty', async () => {
      (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
        if (category === 'auth') return { myAuth: {} };
        return undefined;
      });

      const addApplyEscapeHatchesCallSpy = jest.spyOn(backendGenerator, 'addApplyEscapeHatchesCall');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addApplyEscapeHatchesCallSpy).not.toHaveBeenCalled();
    });
  });
});
