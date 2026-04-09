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
const mockCopyFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  copyFile: (...args: unknown[]) => mockCopyFile(...args),
}));

const mockExistsSync = jest.fn().mockReturnValue(false);
const mockReaddirSync = jest.fn().mockReturnValue([]);
jest.mock('node:fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
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

    it('registers import and defineBackend property on backendGenerator', async () => {
      const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
      const addPropertySpy = jest.spyOn(backendGenerator, 'addDefineBackendProperty');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addImportSpy).toHaveBeenCalledWith('./data/resource', ['data']);
      expect(addPropertySpy).toHaveBeenCalledWith(expect.objectContaining({ name: expect.objectContaining({ escapedText: 'data' }) }));
    });

    it('contributes additional auth providers to backendGenerator when auth exists', async () => {
      (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
        if (category === 'auth') return { myAuth: {} };
        return undefined;
      });
      (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue({
        apiId: 'api-123',
        name: 'myApi',
        additionalAuthenticationProviders: [{ authenticationType: 'AMAZON_COGNITO_USER_POOLS', userPoolConfig: { userPoolId: 'pool-1' } }],
      });

      const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      // Two statements: cfnGraphqlApi declaration + assignment
      expect(addStatementSpy).toHaveBeenCalledTimes(2);
    });

    it('does not contribute additional auth providers when auth category is absent', async () => {
      (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue({
        apiId: 'api-123',
        name: 'myApi',
        additionalAuthenticationProviders: [{ authenticationType: 'AMAZON_COGNITO_USER_POOLS' }],
      });

      const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addStatementSpy).not.toHaveBeenCalled();
    });

    it('does not contribute additional auth providers when list is empty', async () => {
      (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
        if (category === 'auth') return { myAuth: {} };
        return undefined;
      });

      const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

      const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
        category: 'api',
        resourceName: 'testApi',
        service: 'AppSync',
        key: 'api:AppSync',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(addStatementSpy).not.toHaveBeenCalled();
    });

    describe('resolver overrides', () => {
      it('does not add resolver operations when no resolvers directory exists', async () => {
        mockExistsSync.mockReturnValue(false);

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();

        expect(ops).toHaveLength(1);
        const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');
        await ops[0].execute();
        expect(addStatementSpy).not.toHaveBeenCalled();
      });

      it('does not add resolver operations when resolvers directory has no vtl files', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['readme.txt', 'notes.md']);

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();

        expect(ops).toHaveLength(1);
      });

      it('adds a copy operation when vtl files exist', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['Query.listProducts.res.vtl']);

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();

        expect(ops).toHaveLength(2);
        const descriptions = await ops[1].describe();
        expect(descriptions[0]).toContain('1 VTL resolver file(s)');
      });

      it('copies vtl files to amplify/data/resolvers/', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['Query.listProducts.res.vtl', 'Mutation.createProduct.req.vtl']);

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();
        await ops[1].execute();

        expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('resolvers'), { recursive: true });
        expect(mockCopyFile).toHaveBeenCalledTimes(2);
        expect(mockCopyFile).toHaveBeenCalledWith(
          expect.stringContaining('Query.listProducts.res.vtl'),
          expect.stringContaining('Query.listProducts.res.vtl'),
        );
        expect(mockCopyFile).toHaveBeenCalledWith(
          expect.stringContaining('Mutation.createProduct.req.vtl'),
          expect.stringContaining('Mutation.createProduct.req.vtl'),
        );
      });

      it('contributes resolver override imports and statements to backendGenerator', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['Query.listProducts.res.vtl']);

        const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
        const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
        const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();
        await ops[0].execute();

        // Resolver imports: fs (readdirSync only), path, url
        expect(addImportSpy).toHaveBeenCalledWith('fs', ['readdirSync']);
        expect(addImportSpy).toHaveBeenCalledWith('path', ['join', 'dirname']);
        expect(addImportSpy).toHaveBeenCalledWith('url', ['fileURLToPath']);
        expect(addNamespaceImportSpy).toHaveBeenCalledWith('aws-cdk-lib/aws-s3-assets', 'assets');

        // 4 statements: __dirname, resolversDir, resolverFiles, for-of loop
        expect(addStatementSpy).toHaveBeenCalledTimes(4);
      });

      it('handles multiple vtl files of both req and res types', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['Query.listProducts.res.vtl', 'Query.listProducts.req.vtl', 'Mutation.createProduct.res.vtl']);

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();

        expect(ops).toHaveLength(2);
        const descriptions = await ops[1].describe();
        expect(descriptions[0]).toContain('3 VTL resolver file(s)');
      });
    });
  });
});
