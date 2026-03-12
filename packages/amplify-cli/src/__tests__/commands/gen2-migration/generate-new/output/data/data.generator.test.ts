import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { DataGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/data/data.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate-new/input/gen1-app';

jest.unmock('fs-extra');

describe('DataGenerator', () => {
  let outputDir: string;
  let projectRoot: string;
  let backendGenerator: BackendGenerator;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'data-gen-test-'));
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'data-gen-project-'));
    backendGenerator = new BackendGenerator(outputDir);
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  function createMockGen1App(overrides?: Record<string, unknown>): Gen1App {
    return {
      envName: 'main',
      ccbDir: projectRoot,
      meta: jest.fn(),
      aws: {
        fetchGraphqlApi: jest.fn(),
      },
      ...overrides,
    } as unknown as Gen1App;
  }

  async function writeSchema(apiName: string, schema: string): Promise<void> {
    const schemaDir = path.join(projectRoot, 'api', apiName);
    await fs.mkdir(schemaDir, { recursive: true });
    await fs.writeFile(path.join(schemaDir, 'schema.graphql'), schema, 'utf-8');
  }

  it('returns empty operations when api category is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue(undefined);

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir);
    const ops = await generator.plan();

    expect(ops).toHaveLength(0);
  });

  it('returns empty operations when no AppSync API exists', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myRestApi: { service: 'API Gateway' },
    });

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir);
    const ops = await generator.plan();

    expect(ops).toHaveLength(0);
  });

  it('throws when AppSync API has no GraphQLAPIIdOutput', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myApi: { service: 'AppSync', output: {} },
    });
    await writeSchema('myApi', 'type Todo @model { id: ID! }');

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir);

    await expect(generator.plan()).rejects.toThrow('no GraphQLAPIIdOutput');
  });

  it('throws when AppSync API is not found via SDK', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
      if (category === 'api') {
        return {
          myApi: {
            service: 'AppSync',
            output: { GraphQLAPIIdOutput: 'api-123' },
          },
        };
      }
      return undefined;
    });
    await writeSchema('myApi', 'type Todo @model { id: ID! }');
    (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue(undefined);

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir);

    await expect(generator.plan()).rejects.toThrow("AppSync API 'api-123' not found");
  });

  it('returns one operation and writes resource.ts on execute', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockImplementation((category: string) => {
      if (category === 'api') {
        return {
          myApi: {
            service: 'AppSync',
            output: {
              GraphQLAPIIdOutput: 'api-123',
              authConfig: {
                defaultAuthentication: { authenticationType: 'API_KEY' },
              },
            },
          },
        };
      }
      if (category === 'auth') return undefined;
      return undefined;
    });
    await writeSchema('myApi', 'type Todo @model { id: ID! }');
    (gen1App.aws.fetchGraphqlApi as jest.Mock).mockResolvedValue({
      apiId: 'api-123',
      name: 'myApi',
      additionalAuthenticationProviders: [],
    });

    const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
    const addPropertySpy = jest.spyOn(backendGenerator, 'addDefineBackendProperty');

    const generator = new DataGenerator(gen1App, backendGenerator, outputDir);
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('data/resource.ts');

    await ops[0].execute();

    // Verify resource.ts was written
    const resourcePath = path.join(outputDir, 'amplify', 'data', 'resource.ts');
    const content = await fs.readFile(resourcePath, 'utf-8');
    expect(content).toContain('defineData');
    expect(content).toContain('Todo');

    // Verify backend.ts contributions
    expect(addImportSpy).toHaveBeenCalledWith('./data/resource', ['data']);
    expect(addPropertySpy).toHaveBeenCalled();
  });
});
