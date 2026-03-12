import { RestApiGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/rest-api/rest-api.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate-new/input/gen1-app';

function createMockGen1App(): Gen1App {
  return {
    fetchMetaCategory: jest.fn(),
    fetchRestApiConfig: jest.fn(),
    fetchFunctionNames: jest.fn().mockResolvedValue(new Set<string>()),
  } as unknown as Gen1App;
}

describe('RestApiGenerator', () => {
  let backendGenerator: BackendGenerator;

  beforeEach(() => {
    backendGenerator = new BackendGenerator('/tmp/test-output');
  });

  it('returns one operation with correct description', async () => {
    const gen1App = createMockGen1App();
    (gen1App.fetchMetaCategory as jest.Mock).mockResolvedValue(undefined);
    (gen1App.fetchRestApiConfig as jest.Mock).mockResolvedValue({
      apiName: 'myApi',
      functionName: 'myFunc',
      paths: [{ path: '/items', methods: ['GET'], lambdaFunction: 'myFunc' }],
      gen1ApiId: 'abc',
      gen1RootResourceId: 'root',
    });

    const generator = new RestApiGenerator(gen1App, backendGenerator, 'myApi');
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myApi');
  });

  it('contributes imports and statements to backend generator on execute', async () => {
    const gen1App = createMockGen1App();
    (gen1App.fetchMetaCategory as jest.Mock).mockResolvedValue(undefined);
    (gen1App.fetchRestApiConfig as jest.Mock).mockResolvedValue({
      apiName: 'myApi',
      functionName: 'myFunc',
      paths: [{ path: '/items', methods: ['GET'], lambdaFunction: 'myFunc' }],
      gen1ApiId: 'abc',
      gen1RootResourceId: 'root',
      uniqueFunctions: ['myFunc'],
    });

    const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
    const addStatementSpy = jest.spyOn(backendGenerator, 'addStatement');
    const ensureBranchNameSpy = jest.spyOn(backendGenerator, 'ensureBranchName');

    const generator = new RestApiGenerator(gen1App, backendGenerator, 'myApi');
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addImportSpy).toHaveBeenCalled();
    expect(addStatementSpy).toHaveBeenCalled();
    expect(ensureBranchNameSpy).toHaveBeenCalled();
  });
});
