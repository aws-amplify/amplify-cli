import { RestApiGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/rest-api/rest-api.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

function createMockGen1App(): Gen1App {
  return {
    meta: jest.fn(),
    metaOutput: jest.fn(),
    ccbDir: '/tmp/ccb',
    cliInputs: jest.fn(),
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

jest.unmock('fs-extra');

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

describe('RestApiGenerator', () => {
  let backendGenerator: BackendGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator('/tmp/test-output');
  });

  it('returns one operation with correct description', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockImplementation((cat: string) => (cat === 'api' ? API_META : undefined));
    (gen1App.metaOutput as jest.Mock).mockReturnValue('abc');
    (gen1App.cliInputs as jest.Mock).mockReturnValue(CLI_INPUTS);

    const generator = new RestApiGenerator(gen1App, backendGenerator, '/tmp/test-output', {
      category: 'api',
      resourceName: 'myApi',
      service: 'API Gateway',
      key: 'api:API Gateway',
    });
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myApi');
  });

  it('contributes namespace import and post-define statement to backend generator on execute', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockImplementation((cat: string) => (cat === 'api' ? API_META : undefined));
    (gen1App.metaOutput as jest.Mock).mockReturnValue('abc');
    (gen1App.cliInputs as jest.Mock).mockReturnValue(CLI_INPUTS);

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addPostDefineStatementSpy = jest.spyOn(backendGenerator, 'addPostDefineStatement');

    const generator = new RestApiGenerator(gen1App, backendGenerator, '/tmp/test-output', {
      category: 'api',
      resourceName: 'myApi',
      service: 'API Gateway',
      key: 'api:API Gateway',
    });
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('myApi', './api/myApi/resource');
    expect(addPostDefineStatementSpy).toHaveBeenCalled();
  });
});
