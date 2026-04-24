import ts from 'typescript';
import { DataGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';
import {
  parseExtendedResolverFilename,
  classifyResolverFiles,
  groupExtendedResolvers,
  computeSpliceIndexes,
  VALID_SLOTS,
  getSlotBaseIndex,
} from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { DataRenderer, RenderDefineDataOptions } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.renderer';

jest.unmock('fs-extra');

const mockRender = jest.fn().mockReturnValue(ts.factory.createNodeArray([]));
const mockRenderNoneDataSource = jest.fn().mockReturnValue(ts.factory.createEmptyStatement());
const mockRenderAppsyncFunction = jest.fn().mockReturnValue(ts.factory.createEmptyStatement());
const mockRenderSpliceStatements = jest.fn().mockReturnValue([ts.factory.createEmptyStatement()]);
jest.mock('../../../../../../commands/gen2-migration/generate/amplify/data/data.renderer', () => ({
  DataRenderer: jest.fn().mockImplementation(() => ({
    render: mockRender,
    renderNoneDataSource: mockRenderNoneDataSource,
    renderAppsyncFunction: mockRenderAppsyncFunction,
    renderSpliceStatements: mockRenderSpliceStatements,
  })),
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

      it('contributes extended resolver imports and statements when extended vtl files exist', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['Query.listProducts.postAuth.2.req.vtl']);

        const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
        const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();
        await ops[0].execute();

        expect(addImportSpy).toHaveBeenCalledWith('aws-cdk-lib', ['aws_appsync']);
        expect(addImportSpy).toHaveBeenCalledWith('aws-cdk-lib/aws-appsync', ['CfnResolver']);

        // Common declarations (2) + noneDataSource (1) + appsyncFunction (1) + splice statements (1)
        expect(addStatementSpy).toHaveBeenCalled();
        expect(mockRenderNoneDataSource).toHaveBeenCalledTimes(1);
        expect(mockRenderAppsyncFunction).toHaveBeenCalledTimes(1);
        expect(mockRenderSpliceStatements).toHaveBeenCalledTimes(1);
      });

      it('handles mixed override and extended resolver files', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['Query.listProducts.req.vtl', 'Query.listProducts.postAuth.2.req.vtl']);

        const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
        const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();
        await ops[0].execute();

        // Override imports
        expect(addImportSpy).toHaveBeenCalledWith('fs', ['readdirSync']);
        expect(addImportSpy).toHaveBeenCalledWith('url', ['fileURLToPath']);

        // Extended resolver imports
        expect(addImportSpy).toHaveBeenCalledWith('aws-cdk-lib', ['aws_appsync']);
        expect(addImportSpy).toHaveBeenCalledWith('aws-cdk-lib/aws-appsync', ['CfnResolver']);

        // Both override and extended statements contributed
        expect(addStatementSpy).toHaveBeenCalled();
        expect(mockRenderNoneDataSource).toHaveBeenCalledTimes(1);
        expect(mockRenderAppsyncFunction).toHaveBeenCalledTimes(1);
      });

      it('does not add extended resolver imports when only override files exist', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue(['Query.listProducts.req.vtl']);

        const addImportSpy = jest.spyOn(backendGenerator, 'addImport');

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });
        const ops = await generator.plan();
        await ops[0].execute();

        expect(addImportSpy).not.toHaveBeenCalledWith('aws-cdk-lib', ['aws_appsync']);
        expect(addImportSpy).not.toHaveBeenCalledWith('aws-cdk-lib/aws-appsync', ['CfnResolver']);
        expect(mockRenderNoneDataSource).not.toHaveBeenCalled();
        expect(mockRenderAppsyncFunction).not.toHaveBeenCalled();
      });
    });
  });
});

describe('parseExtendedResolverFilename', () => {
  it('parses a valid extended resolver filename with req template', () => {
    const result = parseExtendedResolverFilename('Query.listProducts.postAuth.2.req.vtl');
    expect(result).toEqual({
      typeName: 'Query',
      fieldName: 'listProducts',
      slot: 'postAuth',
      order: 2,
      templateType: 'req',
      filename: 'Query.listProducts.postAuth.2.req.vtl',
    });
  });

  it('parses a valid extended resolver filename with res template', () => {
    const result = parseExtendedResolverFilename('Mutation.createProduct.preUpdate.1.res.vtl');
    expect(result).toEqual({
      typeName: 'Mutation',
      fieldName: 'createProduct',
      slot: 'preUpdate',
      order: 1,
      templateType: 'res',
      filename: 'Mutation.createProduct.preUpdate.1.res.vtl',
    });
  });

  it('parses all valid slots for their respective operation types', () => {
    const slotTypeMap: Record<string, string> = {
      init: 'Query',
      preAuth: 'Query',
      auth: 'Query',
      postAuth: 'Query',
      preDataLoad: 'Query',
      postDataLoad: 'Query',
      preUpdate: 'Mutation',
      postUpdate: 'Mutation',
      preSubscribe: 'Subscription',
      finish: 'Query',
    };
    for (const slot of VALID_SLOTS) {
      const typeName = slotTypeMap[slot];
      const filename = `${typeName}.someField.${slot}.1.req.vtl`;
      const result = parseExtendedResolverFilename(filename);
      expect(result.slot).toBe(slot);
    }
  });

  it('throws for invalid slot', () => {
    expect(() => parseExtendedResolverFilename('Query.listProducts.invalidSlot.1.req.vtl')).toThrow('invalidSlot');
    expect(() => parseExtendedResolverFilename('Query.listProducts.invalidSlot.1.req.vtl')).toThrow(
      'Query.listProducts.invalidSlot.1.req.vtl',
    );
  });

  it('throws for non-numeric order', () => {
    expect(() => parseExtendedResolverFilename('Query.listProducts.postAuth.abc.req.vtl')).toThrow('abc');
    expect(() => parseExtendedResolverFilename('Query.listProducts.postAuth.abc.req.vtl')).toThrow(
      'Query.listProducts.postAuth.abc.req.vtl',
    );
  });
});

describe('classifyResolverFiles', () => {
  it('classifies override resolver files (4 segments)', () => {
    const result = classifyResolverFiles(['Query.listProducts.req.vtl', 'Query.listProducts.res.vtl']);
    expect(result.overrideFiles).toEqual(['Query.listProducts.req.vtl', 'Query.listProducts.res.vtl']);
    expect(result.extendedDescriptors).toEqual([]);
  });

  it('classifies extended resolver files (6 segments)', () => {
    const result = classifyResolverFiles(['Query.listProducts.postAuth.2.req.vtl']);
    expect(result.overrideFiles).toEqual([]);
    expect(result.extendedDescriptors).toHaveLength(1);
    expect(result.extendedDescriptors[0].slot).toBe('postAuth');
  });

  it('classifies mixed override and extended files', () => {
    const result = classifyResolverFiles(['Query.listProducts.req.vtl', 'Query.listProducts.postAuth.2.req.vtl']);
    expect(result.overrideFiles).toHaveLength(1);
    expect(result.extendedDescriptors).toHaveLength(1);
  });

  it('ignores files with unexpected segment counts', () => {
    const result = classifyResolverFiles(['readme.txt', 'some.random.file.with.many.parts.vtl']);
    expect(result.overrideFiles).toEqual([]);
    expect(result.extendedDescriptors).toEqual([]);
  });
});

describe('groupExtendedResolvers', () => {
  it('groups descriptors by typeName and fieldName', () => {
    const descriptors = [
      parseExtendedResolverFilename('Query.listProducts.postAuth.1.req.vtl'),
      parseExtendedResolverFilename('Query.getProduct.postAuth.1.req.vtl'),
    ];
    const groups = groupExtendedResolvers(descriptors);
    expect(groups).toHaveLength(2);
  });

  it('sorts functions within a group by slot pipeline order', () => {
    const descriptors = [
      parseExtendedResolverFilename('Query.listProducts.postDataLoad.1.req.vtl'),
      parseExtendedResolverFilename('Query.listProducts.postAuth.1.req.vtl'),
    ];
    const groups = groupExtendedResolvers(descriptors);
    expect(groups).toHaveLength(1);
    expect(groups[0].functions[0].slot).toBe('postAuth');
    expect(groups[0].functions[1].slot).toBe('postDataLoad');
  });

  it('sorts functions within the same slot by numeric order', () => {
    const descriptors = [
      parseExtendedResolverFilename('Query.listProducts.postAuth.3.req.vtl'),
      parseExtendedResolverFilename('Query.listProducts.postAuth.1.req.vtl'),
    ];
    const groups = groupExtendedResolvers(descriptors);
    expect(groups).toHaveLength(1);
    expect(groups[0].functions[0].order).toBe(1);
    expect(groups[0].functions[1].order).toBe(3);
  });

  it('pairs request and response templates for the same slot and order', () => {
    const descriptors = [
      parseExtendedResolverFilename('Query.listProducts.postAuth.1.req.vtl'),
      parseExtendedResolverFilename('Query.listProducts.postAuth.1.res.vtl'),
    ];
    const groups = groupExtendedResolvers(descriptors);
    expect(groups).toHaveLength(1);
    expect(groups[0].functions).toHaveLength(1);
    expect(groups[0].functions[0].requestFile).toBe('Query.listProducts.postAuth.1.req.vtl');
    expect(groups[0].functions[0].responseFile).toBe('Query.listProducts.postAuth.1.res.vtl');
  });

  it('leaves requestFile undefined when only response template exists', () => {
    const descriptors = [parseExtendedResolverFilename('Query.listProducts.postAuth.1.res.vtl')];
    const groups = groupExtendedResolvers(descriptors);
    expect(groups[0].functions[0].requestFile).toBeUndefined();
    expect(groups[0].functions[0].responseFile).toBe('Query.listProducts.postAuth.1.res.vtl');
  });

  it('leaves responseFile undefined when only request template exists', () => {
    const descriptors = [parseExtendedResolverFilename('Query.listProducts.postAuth.1.req.vtl')];
    const groups = groupExtendedResolvers(descriptors);
    expect(groups[0].functions[0].requestFile).toBe('Query.listProducts.postAuth.1.req.vtl');
    expect(groups[0].functions[0].responseFile).toBeUndefined();
  });
});

describe('computeSpliceIndexes', () => {
  const queryBaseIndex = getSlotBaseIndex('Query', 'listProducts');

  it('computes base index for a single function', () => {
    const group = {
      typeName: 'Query',
      fieldName: 'listProducts',
      functions: [
        {
          typeName: 'Query',
          fieldName: 'listProducts',
          slot: 'postAuth' as const,
          order: 1,
          requestFile: 'f.vtl',
          responseFile: undefined,
        },
      ],
    };
    const result = computeSpliceIndexes(group);
    expect(result).toHaveLength(1);
    expect(result[0].spliceIndex).toBe(queryBaseIndex['postAuth']);
  });

  it('increments offset for multiple functions', () => {
    const group = {
      typeName: 'Query',
      fieldName: 'listProducts',
      functions: [
        {
          typeName: 'Query',
          fieldName: 'listProducts',
          slot: 'postAuth' as const,
          order: 1,
          requestFile: 'f.vtl',
          responseFile: undefined,
        },
        {
          typeName: 'Query',
          fieldName: 'listProducts',
          slot: 'postDataLoad' as const,
          order: 1,
          requestFile: 'g.vtl',
          responseFile: undefined,
        },
      ],
    };
    const result = computeSpliceIndexes(group);
    expect(result).toHaveLength(2);
    expect(result[0].spliceIndex).toBe(queryBaseIndex['postAuth']);
    expect(result[1].spliceIndex).toBe(queryBaseIndex['postDataLoad'] + 1);
  });

  it('handles multiple functions at the same slot', () => {
    const group = {
      typeName: 'Query',
      fieldName: 'listProducts',
      functions: [
        {
          typeName: 'Query',
          fieldName: 'listProducts',
          slot: 'postAuth' as const,
          order: 1,
          requestFile: 'f.vtl',
          responseFile: undefined,
        },
        {
          typeName: 'Query',
          fieldName: 'listProducts',
          slot: 'postAuth' as const,
          order: 2,
          requestFile: 'g.vtl',
          responseFile: undefined,
        },
      ],
    };
    const result = computeSpliceIndexes(group);
    expect(result).toHaveLength(2);
    expect(result[0].spliceIndex).toBe(queryBaseIndex['postAuth']);
    expect(result[1].spliceIndex).toBe(queryBaseIndex['postAuth'] + 1);
  });

  it('returns empty array for group with no functions', () => {
    const group = {
      typeName: 'Query',
      fieldName: 'listProducts',
      functions: [],
    };
    const result = computeSpliceIndexes(group);
    expect(result).toEqual([]);
  });
});
