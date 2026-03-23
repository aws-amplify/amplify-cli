import { DynamoDBGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/storage/dynamodb.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

function createMockGen1App(overrides?: Partial<Gen1App>): Gen1App {
  return {
    meta: jest.fn(),
    aws: {
      fetchTableDescription: jest.fn(),
    },
    ...overrides,
  } as unknown as Gen1App;
}

describe('DynamoDBGenerator', () => {
  let backendGenerator: BackendGenerator;

  beforeEach(() => {
    backendGenerator = new BackendGenerator('/tmp/test-output');
  });

  it('throws when storage category is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue(undefined);

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, 'myTable', false);

    await expect(generator.plan()).rejects.toThrow();
  });

  it('throws when resource is not in storage category', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      otherTable: { service: 'DynamoDB' },
    });

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, 'myTable', false);

    await expect(generator.plan()).rejects.toThrow();
  });

  it('returns one operation when resource exists', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myTable: {
        service: 'DynamoDB',
        output: { Name: 'myTable-abc123' },
      },
    });
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, 'myTable', false);
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myTable');
  });

  it('contributes imports and early statements to backend generator on execute', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myTable: {
        service: 'DynamoDB',
        output: { Name: 'myTable-abc123' },
      },
    });
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const addImportSpy = jest.spyOn(backendGenerator, 'addImport');
    const ensureStorageStackSpy = jest.spyOn(backendGenerator, 'ensureStorageStack');
    const addEarlyStatementSpy = jest.spyOn(backendGenerator, 'addEarlyStatement');

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, 'myTable', false);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addImportSpy).toHaveBeenCalledWith('aws-cdk-lib/aws-dynamodb', expect.arrayContaining(['Table', 'AttributeType']));
    expect(ensureStorageStackSpy).toHaveBeenCalledWith(false);
    expect(addEarlyStatementSpy).toHaveBeenCalled();
  });

  it('passes hasS3Bucket=true to ensureStorageStack', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myTable: {
        service: 'DynamoDB',
        output: { Name: 'myTable-abc123' },
      },
    });
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const ensureStorageStackSpy = jest.spyOn(backendGenerator, 'ensureStorageStack');

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, 'myTable', true);
    const ops = await generator.plan();
    await ops[0].execute();

    expect(ensureStorageStackSpy).toHaveBeenCalledWith(true);
  });

  it('throws when table is not found in AWS', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myTable: {
        service: 'DynamoDB',
        output: { Name: 'myTable-abc123' },
      },
    });
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue(undefined);

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, 'myTable', false);

    await expect(generator.plan()).rejects.toThrow("DynamoDB table 'myTable-abc123' not found");
  });

  it('handles table with GSIs', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myTable: {
        service: 'DynamoDB',
        output: { Name: 'myTable-abc123' },
      },
    });
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

    const addEarlyStatementSpy = jest.spyOn(backendGenerator, 'addEarlyStatement');

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, 'myTable', false);
    const ops = await generator.plan();
    await ops[0].execute();

    // Should have multiple early statements (table + GSI addGlobalSecondaryIndex)
    expect(addEarlyStatementSpy).toHaveBeenCalled();
    expect(addEarlyStatementSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('uses resourceName as table name when output.Name is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      myTable: {
        service: 'DynamoDB',
      },
    });
    (gen1App.aws.fetchTableDescription as jest.Mock).mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const generator = new DynamoDBGenerator(gen1App, backendGenerator, 'myTable', false);
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    // Verify it called fetchTableDescription with the resourceName
    expect(gen1App.aws.fetchTableDescription).toHaveBeenCalledWith('myTable');
  });
});
