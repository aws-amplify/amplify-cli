import { RestApiGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/rest-api/rest-api.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate-new/input/gen1-app';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  JSONUtilities: { readJson: jest.fn() },
}));

function createMockGen1App(): Gen1App {
  return {
    fetchMetaCategory: jest.fn(),
    findProjectRoot: jest.fn().mockReturnValue('/tmp/project'),
    aws: {
      fetchRestApiRootResourceId: jest.fn().mockResolvedValue('root-resource-id'),
    },
  } as unknown as Gen1App;
}

const API_META = {
  myApi: {
    service: 'API Gateway',
    dependsOn: [{ category: 'function', resourceName: 'myFunc' }],
    output: { ApiId: 'abc' },
  },
};

const CLI_INPUTS = {
  paths: {
    '/items': {
      methods: ['GET'],
      lambdaFunction: 'myFunc',
    },
  },
};

describe('RestApiGenerator', () => {
  let backendGenerator: BackendGenerator;

  beforeEach(() => {
    backendGenerator = new BackendGenerator('/tmp/test-output');
    (JSONUtilities.readJson as jest.Mock).mockReturnValue(CLI_INPUTS);
  });

  it('returns one operation with correct description', async () => {
    const gen1App = createMockGen1App();
    (gen1App.fetchMetaCategory as jest.Mock).mockImplementation(async (cat: string) => (cat === 'api' ? API_META : undefined));

    const generator = new RestApiGenerator(gen1App, backendGenerator, 'myApi');
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myApi');
  });

  it('contributes imports and statements to backend generator on execute', async () => {
    const gen1App = createMockGen1App();
    (gen1App.fetchMetaCategory as jest.Mock).mockImplementation(async (cat: string) => (cat === 'api' ? API_META : undefined));

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
