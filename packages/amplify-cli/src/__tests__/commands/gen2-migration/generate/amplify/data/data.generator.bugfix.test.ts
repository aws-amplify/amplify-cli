import ts from 'typescript';
import fc from 'fast-check';
import { DataGenerator, classifyResolverFiles } from '../../../../../../commands/gen2-migration/generate/amplify/data/data.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

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

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('output.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

/** Prints a TypeScript AST statement to a string. */
function printStatement(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

function createMockGen1App(): Gen1App {
  return {
    envName: 'main',
    ccbDir: '/tmp/ccb',
    meta: jest.fn().mockReturnValue(undefined),
    metaOutput: jest.fn().mockImplementation((_cat: string, _res: string, key: string) => {
      if (key === 'GraphQLAPIIdOutput') return 'api-123';
      return { defaultAuthentication: { authenticationType: 'API_KEY' } };
    }),
    singleResourceName: jest.fn().mockReturnValue('myApi'),
    file: jest.fn().mockReturnValue('type Todo @model { id: ID! }'),
    aws: {
      fetchGraphqlApi: jest.fn().mockResolvedValue({
        apiId: 'api-123',
        name: 'myApi',
        additionalAuthenticationProviders: [],
      }),
    },
  } as unknown as Gen1App;
}

/** Generates a PascalCase type name. */
const typeNameArb = fc.constantFrom('Query', 'Mutation', 'Subscription');

/** Generates a camelCase field name. */
const fieldNameArb = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), { minLength: 3, maxLength: 12 })
  .map((s) => s.charAt(0).toLowerCase() + s.slice(1));

/** Generates a valid pipeline slot name. */
const slotArb = fc.constantFrom('init', 'preAuth', 'auth', 'postAuth', 'preDataLoad', 'postDataLoad', 'preUpdate', 'postUpdate', 'finish');

/** Generates a numeric order. */
const orderArb = fc.integer({ min: 1, max: 5 });

/** Generates a template type. */
const templateTypeArb = fc.constantFrom('req', 'res');

/** Generates a 6-segment extended resolver filename. */
const extendedFilenameArb = fc
  .tuple(typeNameArb, fieldNameArb, slotArb, orderArb, templateTypeArb)
  .map(([typeName, fieldName, slot, order, templateType]) => `${typeName}.${fieldName}.${slot}.${order}.${templateType}.vtl`);

describe('Bug Condition Exploration — Override Loop Matches Extended Resolver Files', () => {
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
   *
   * Property 1: Bug Condition — Override Loop Matches Extended Resolver Files
   *
   * For any set of VTL files containing both a 4-segment override file and a
   * 6-segment extended resolver file, the generated override loop's
   * `resolverFiles` filter SHOULD include a segment-count guard
   * (`f.split(".").length === 4`) that excludes extended resolver files.
   *
   * On UNFIXED code, this test is EXPECTED TO FAIL because the generated
   * filter only checks `.endsWith(".req.vtl") || .endsWith(".res.vtl")`
   * without a segment-count guard.
   */
  it('generated resolverFiles filter includes segment-count guard to exclude extended resolver files', async () => {
    await fc.assert(
      fc.asyncProperty(extendedFilenameArb, async (extendedFile) => {
        jest.clearAllMocks();

        // Set up mock with both a 4-segment override file and the generated 6-segment file
        const overrideFile = 'Query.listProducts.req.vtl';
        mockExistsSync.mockReturnValue(true);
        mockReaddirSync.mockReturnValue([overrideFile, extendedFile]);

        const gen1App = createMockGen1App();
        const backendGenerator = new BackendGenerator(outputDir);
        const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

        const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
          category: 'api',
          resourceName: 'testApi',
          service: 'AppSync',
          key: 'api:AppSync',
        });

        const ops = await generator.plan();
        await ops[0].execute();

        // Find the resolverFiles declaration statement among the statements added
        const statements = addStatementSpy.mock.calls.map((call) => call[0]);
        const resolverFilesStatement = statements.find((stmt) => {
          const printed = printStatement(stmt);
          return printed.includes('resolverFiles');
        });

        // The resolverFiles statement must exist (override files are present)
        expect(resolverFilesStatement).toBeDefined();

        const printed = printStatement(resolverFilesStatement!);

        // The generated filter SHOULD include a segment-count guard.
        // On unfixed code, this will FAIL because the filter is:
        //   f.endsWith(".req.vtl") || f.endsWith(".res.vtl")
        // The expected (fixed) filter should include:
        //   f.split(".").length === 4
        expect(printed).toContain('f.split(".").length === 4');
      }),
      { numRuns: 20 },
    );
  });
});

/** Generates a 4-segment override resolver filename. */
const overrideFilenameArb = fc
  .tuple(typeNameArb, fieldNameArb, templateTypeArb)
  .map(([typeName, fieldName, templateType]) => `${typeName}.${fieldName}.${templateType}.vtl`);

describe('Preservation — Override Loop Includes 4-Segment Override Files', () => {
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * **Validates: Requirements 3.1, 3.2**
   *
   * Test A: Override-only preservation
   *
   * When only 4-segment override files are present, the generated code
   * contributes exactly 4 statements to backendGenerator: `__dirname`,
   * `resolversDir`, `resolverFiles`, and the for-of loop. The
   * `resolverFiles` statement must contain a filter expression.
   */
  it('override-only files produce 4 statements including resolverFiles filter', async () => {
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockReturnValue(['Query.listProducts.req.vtl', 'Mutation.createTodo.res.vtl']);

    const gen1App = createMockGen1App();
    const backendGenerator = new BackendGenerator(outputDir);
    const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
      category: 'api',
      resourceName: 'testApi',
      service: 'AppSync',
      key: 'api:AppSync',
    });

    const ops = await generator.plan();
    await ops[0].execute();

    // 4 statements: __dirname, resolversDir, resolverFiles, for-of loop
    expect(addStatementSpy).toHaveBeenCalledTimes(4);

    const statements = addStatementSpy.mock.calls.map((call) => call[0]);
    const printedStatements = statements.map((stmt) => printStatement(stmt));

    // Verify __dirname declaration
    expect(printedStatements[0]).toContain('__dirname');
    expect(printedStatements[0]).toContain('dirname');

    // Verify resolversDir declaration
    expect(printedStatements[1]).toContain('resolversDir');

    // Verify resolverFiles declaration with filter
    expect(printedStatements[2]).toContain('resolverFiles');
    expect(printedStatements[2]).toContain('readdirSync');
    expect(printedStatements[2]).toContain('filter');

    // Verify for-of loop
    expect(printedStatements[3]).toContain('for (const file of resolverFiles)');
  });

  /**
   * **Validates: Requirements 3.4**
   *
   * Test B: No-VTL preservation
   *
   * When no VTL files exist (empty resolvers directory or no resolvers
   * directory), no resolver override statements are added to
   * backendGenerator.
   */
  it('no VTL files produces no resolver override statements', async () => {
    mockExistsSync.mockReturnValue(false);
    mockReaddirSync.mockReturnValue([]);

    const gen1App = createMockGen1App();
    const backendGenerator = new BackendGenerator(outputDir);
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

  /**
   * **Validates: Requirements 3.1, 3.2, 3.3**
   *
   * Test C: Classification preservation (property-based)
   *
   * For any randomly generated set of VTL filenames (mix of 4-segment
   * and 6-segment), `classifyResolverFiles()` correctly classifies
   * 4-segment files as overrides and 6-segment files as extended
   * descriptors. This function is NOT being changed, so it must produce
   * identical results before and after the fix.
   */
  it('classifyResolverFiles correctly classifies 4-segment and 6-segment files', () => {
    fc.assert(
      fc.property(fc.array(fc.oneof(overrideFilenameArb, extendedFilenameArb), { minLength: 1, maxLength: 10 }), (filenames) => {
        // Deduplicate to avoid duplicate extended resolver errors
        const unique = [...new Set(filenames)];
        const result = classifyResolverFiles(unique);

        const expected4Segment = unique.filter((f) => f.split('.').length === 4);
        const expected6Segment = unique.filter((f) => f.split('.').length === 6);

        // All 4-segment files are classified as overrides
        expect(result.overrideFiles).toEqual(expected4Segment);

        // All 6-segment files are classified as extended descriptors
        expect(result.extendedDescriptors).toHaveLength(expected6Segment.length);

        // Each extended descriptor has the correct filename
        for (const desc of result.extendedDescriptors) {
          expect(expected6Segment).toContain(desc.filename);
        }
      }),
      { numRuns: 50 },
    );
  });

  /**
   * **Validates: Requirements 3.1, 3.2**
   *
   * Property-based: For any set of 4-segment override filenames, the
   * generated code produces exactly 4 statements (consistent structure).
   */
  it('any set of override-only files produces exactly 4 statements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(overrideFilenameArb, { minLength: 1, maxLength: 8 }).map((files) => [...new Set(files)]),
        async (overrideFiles) => {
          jest.clearAllMocks();

          mockExistsSync.mockReturnValue(true);
          mockReaddirSync.mockReturnValue(overrideFiles);

          const gen1App = createMockGen1App();
          const backendGenerator = new BackendGenerator(outputDir);
          const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');

          const generator = new DataGenerator(gen1App, backendGenerator, outputDir, {
            category: 'api',
            resourceName: 'testApi',
            service: 'AppSync',
            key: 'api:AppSync',
          });

          const ops = await generator.plan();
          await ops[0].execute();

          // Override-only files always produce exactly 4 statements:
          // __dirname, resolversDir, resolverFiles, for-of loop
          expect(addStatementSpy).toHaveBeenCalledTimes(4);

          // The resolverFiles statement must contain a filter
          const statements = addStatementSpy.mock.calls.map((call) => call[0]);
          const resolverFilesStmt = printStatement(statements[2]);
          expect(resolverFilesStmt).toContain('resolverFiles');
          expect(resolverFilesStmt).toContain('filter');
        },
      ),
      { numRuns: 20 },
    );
  });
});
