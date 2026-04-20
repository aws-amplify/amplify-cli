import { DynamoDBGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/storage/dynamodb.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

jest.unmock('fs-extra');

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

function createMockGen1App(overrides?: Partial<Gen1App>): Gen1App {
  return {
    meta: jest.fn(),
    metaOutput: jest.fn(),
    aws: {
      fetchTableDescription: jest.fn(),
    },
    ...overrides,
  } as unknown as Gen1App;
}

describe('DynamoDBGenerator', () => {
  let backendGenerator: BackendGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator('/tmp/test-output');
  });

  it('throws when table is not found in AWS', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockReturnValue('myTable-abc123');
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue(undefined);

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, '/tmp/test-output', {
      category: 'storage',
      resourceName: 'myTable',
      service: 'DynamoDB',
      key: 'storage:DynamoDB',
    });

    await expect(generator.plan()).rejects.toThrow("DynamoDB table 'myTable-abc123' not found");
  });

  it('returns one operation when resource exists', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockReturnValue('myTable-abc123');
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, '/tmp/test-output', {
      category: 'storage',
      resourceName: 'myTable',
      service: 'DynamoDB',
      key: 'storage:DynamoDB',
    });
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myTable');
  });

  it('contributes namespace import and post-define call to backend generator on execute', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockReturnValue('myTable-abc123');
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addPostDefineCallSpy = jest.spyOn(backendGenerator, 'addPostDefineCall');
    const addPostRefactorCallSpy = jest.spyOn(backendGenerator, 'addPostRefactorCall');

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, '/tmp/test-output', {
      category: 'storage',
      resourceName: 'myTable',
      service: 'DynamoDB',
      key: 'storage:DynamoDB',
    });
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('storageMyTable', './storage/myTable/resource');
    expect(addPostDefineCallSpy).toHaveBeenCalledWith('myTable', expect.stringContaining('storageMyTable.defineStorageMyTable(backend)'));
    expect(addPostRefactorCallSpy).toHaveBeenCalledWith(expect.stringContaining('storageMyTable.postRefactor'));
  });

  it('handles table with GSIs', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockReturnValue('myTable-abc123');
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
      ],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
      GlobalSecondaryIndexes: [
        {
          IndexName: 'byStatus',
          KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        },
      ],
    });

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, '/tmp/test-output', {
      category: 'storage',
      resourceName: 'myTable',
      service: 'DynamoDB',
      key: 'storage:DynamoDB',
    });
    const ops = await generator.plan();
    await ops[0].execute();

    // Should write a resource.ts file
    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('resource.ts'), expect.any(String), 'utf-8');
  });

  it('creates separate resources for two DDB tables', async () => {
    const gen1App = createMockGen1App();
    (gen1App.metaOutput as jest.Mock).mockImplementation((_cat: string, resourceName: string) => `${resourceName}-abc123`);
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');

    const gen1 = new DynamoDBGenerator(gen1App, backendGenerator, '/tmp/test-output', {
      category: 'storage',
      resourceName: 'activity',
      service: 'DynamoDB',
      key: 'storage:DynamoDB',
    });
    const gen2 = new DynamoDBGenerator(gen1App, backendGenerator, '/tmp/test-output', {
      category: 'storage',
      resourceName: 'bookmarks',
      service: 'DynamoDB',
      key: 'storage:DynamoDB',
    });

    const ops1 = await gen1.plan();
    await ops1[0].execute();
    const ops2 = await gen2.plan();
    await ops2[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('storageActivity', './storage/activity/resource');
    expect(addNamespaceImportSpy).toHaveBeenCalledWith('storageBookmarks', './storage/bookmarks/resource');
  });
});
