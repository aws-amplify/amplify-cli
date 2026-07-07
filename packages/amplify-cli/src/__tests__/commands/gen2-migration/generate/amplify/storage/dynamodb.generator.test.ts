import { DynamoDBGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/storage/dynamodb.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { createGen1App } from '../../_helpers/create-gen1-app';
import { SpinningLogger } from '../../../../../../commands/gen2-migration/_common/spinning-logger';

jest.unmock('fs-extra');

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

function writtenFile(suffix: string): string {
  const call = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith(suffix));
  if (!call) throw new Error(`No writeFile call ending with '${suffix}'`);
  return call[1] as string;
}

describe('DynamoDBGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/tmp/test-output';
  const logger = new SpinningLogger('test');

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir, logger);
  });

  it('throws when table is not found in AWS', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        myTable: {
          service: 'DynamoDB',
          output: { Name: 'myTable-abc123' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue(undefined);

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myTable',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );

    await expect(generator.plan()).rejects.toThrow("DynamoDB table 'myTable-abc123' not found");
  });

  it('returns one operation when resource exists', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        myTable: {
          service: 'DynamoDB',
          output: { Name: 'myTable-abc123' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myTable',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const ops = await generator.plan();

    expect(ops).toHaveLength(1);
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('myTable');
  });

  it('contributes namespace import and post-define call to backend generator on execute', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        myTable: {
          service: 'DynamoDB',
          output: { Name: 'myTable-abc123' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');
    const addPostDefineCallSpy = jest.spyOn(backendGenerator, 'addPostDefineBackendCall');
    const addPostRefactorCallSpy = jest.spyOn(backendGenerator, 'addPostRefactorCall');

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myTable',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('storageMyTable', './storage/myTable/resource');
    expect(addPostDefineCallSpy).toHaveBeenCalledWith('myTable', expect.stringContaining('storageMyTable.defineStorageMyTable(backend)'));
    expect(addPostRefactorCallSpy).toHaveBeenCalledWith(expect.stringContaining('storageMyTable.postRefactor'));
  });

  it('creates separate resources for two DDB tables', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        activity: { service: 'DynamoDB', output: { Name: 'table-abc123' } },
        bookmarks: { service: 'DynamoDB', output: { Name: 'table-abc123' } },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const addNamespaceImportSpy = jest.spyOn(backendGenerator, 'addNamespaceImport');

    const gen1 = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'activity',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const gen2 = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'bookmarks',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );

    const ops1 = await gen1.plan();
    await ops1[0].execute();
    const ops2 = await gen2.plan();
    await ops2[0].execute();

    expect(addNamespaceImportSpy).toHaveBeenCalledWith('storageActivity', './storage/activity/resource');
    expect(addNamespaceImportSpy).toHaveBeenCalledWith('storageBookmarks', './storage/bookmarks/resource');
  });

  it('renders a basic table with partition key', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        myTable: {
          service: 'DynamoDB',
          output: { Name: 'MyTable-abc123' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myTable',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import type { Backend } from '../../backend';
      import {
        Table,
        AttributeType,
        BillingMode,
        StreamViewType,
        CfnTable,
      } from 'aws-cdk-lib/aws-dynamodb';
      import { CfnResource } from 'aws-cdk-lib';

      export function defineStorageMyTable(backend: Backend) {
        const storageMyTableStack = backend.createStack('storagemyTable');
        new Table(storageMyTableStack, 'MyTable', {
          partitionKey: { name: 'id', type: AttributeType.STRING },
          billingMode: BillingMode.PAY_PER_REQUEST,
        });
        for (const cfnResource of storageMyTableStack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              c.cfnResourceType === 'AWS::DynamoDB::Table'
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }

      export function postRefactor(MyTable: Table) {
        (MyTable.node.defaultChild as CfnTable).tableName = 'MyTable-abc123';
      }
      "
    `);
  });

  it('renders a table with sort key and provisioned billing', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        myTable: {
          service: 'DynamoDB',
          output: { Name: 'MyTable-abc123' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'N' },
      ],
      BillingModeSummary: { BillingMode: 'PROVISIONED' },
      ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 5 },
    });

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'myTable',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import type { Backend } from '../../backend';
      import {
        Table,
        AttributeType,
        BillingMode,
        StreamViewType,
        CfnTable,
      } from 'aws-cdk-lib/aws-dynamodb';
      import { CfnResource } from 'aws-cdk-lib';

      export function defineStorageMyTable(backend: Backend) {
        const storageMyTableStack = backend.createStack('storagemyTable');
        new Table(storageMyTableStack, 'MyTable', {
          partitionKey: { name: 'pk', type: AttributeType.STRING },
          billingMode: BillingMode.PROVISIONED,
          readCapacity: 10,
          writeCapacity: 5,
          sortKey: { name: 'sk', type: AttributeType.NUMBER },
        });
        for (const cfnResource of storageMyTableStack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              c.cfnResourceType === 'AWS::DynamoDB::Table'
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }

      export function postRefactor(MyTable: Table) {
        (MyTable.node.defaultChild as CfnTable).tableName = 'MyTable-abc123';
      }
      "
    `);
  });

  it('renders stream configuration', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        streamTable: {
          service: 'DynamoDB',
          output: { Name: 'StreamTable-abc' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
      StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
    });

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'streamTable',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import type { Backend } from '../../backend';
      import {
        Table,
        AttributeType,
        BillingMode,
        StreamViewType,
        CfnTable,
      } from 'aws-cdk-lib/aws-dynamodb';
      import { CfnResource } from 'aws-cdk-lib';

      export function defineStorageStreamTable(backend: Backend) {
        const storageStreamTableStack = backend.createStack('storagestreamTable');
        new Table(storageStreamTableStack, 'StreamTable', {
          partitionKey: { name: 'id', type: AttributeType.STRING },
          billingMode: BillingMode.PAY_PER_REQUEST,
          stream: StreamViewType.NEW_AND_OLD_IMAGES,
        });
        for (const cfnResource of storageStreamTableStack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              c.cfnResourceType === 'AWS::DynamoDB::Table'
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }

      export function postRefactor(StreamTable: Table) {
        (StreamTable.node.defaultChild as CfnTable).tableName = 'StreamTable-abc';
      }
      "
    `);
  });

  it('does not render stream when disabled', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        noStream: {
          service: 'DynamoDB',
          output: { Name: 'NoStream-abc' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
      StreamSpecification: { StreamEnabled: false },
    });

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'noStream',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import type { Backend } from '../../backend';
      import {
        Table,
        AttributeType,
        BillingMode,
        StreamViewType,
        CfnTable,
      } from 'aws-cdk-lib/aws-dynamodb';
      import { CfnResource } from 'aws-cdk-lib';

      export function defineStorageNoStream(backend: Backend) {
        const storageNoStreamStack = backend.createStack('storagenoStream');
        new Table(storageNoStreamStack, 'NoStream', {
          partitionKey: { name: 'id', type: AttributeType.STRING },
          billingMode: BillingMode.PAY_PER_REQUEST,
        });
        for (const cfnResource of storageNoStreamStack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              c.cfnResourceType === 'AWS::DynamoDB::Table'
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }

      export function postRefactor(NoStream: Table) {
        (NoStream.node.defaultChild as CfnTable).tableName = 'NoStream-abc';
      }
      "
    `);
  });

  it('renders GSIs with addGlobalSecondaryIndex calls', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        gsiTable: {
          service: 'DynamoDB',
          output: { Name: 'GsiTable-abc' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'date', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'N' },
      ],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
      GlobalSecondaryIndexes: [
        {
          IndexName: 'byStatus',
          KeySchema: [{ AttributeName: 'status', KeyType: 'HASH' }],
        },
        {
          IndexName: 'byDate',
          KeySchema: [
            { AttributeName: 'date', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' },
          ],
        },
      ],
    });

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'gsiTable',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import type { Backend } from '../../backend';
      import {
        Table,
        AttributeType,
        BillingMode,
        StreamViewType,
        CfnTable,
      } from 'aws-cdk-lib/aws-dynamodb';
      import { CfnResource } from 'aws-cdk-lib';

      export function defineStorageGsiTable(backend: Backend) {
        const storageGsiTableStack = backend.createStack('storagegsiTable');
        const GsiTable = new Table(storageGsiTableStack, 'GsiTable', {
          partitionKey: { name: 'id', type: AttributeType.STRING },
          billingMode: BillingMode.PAY_PER_REQUEST,
        });
        GsiTable.addGlobalSecondaryIndex({
          indexName: 'byStatus',
          partitionKey: { name: 'status', type: AttributeType.STRING },
          readCapacity: 5,
          writeCapacity: 5,
        });
        GsiTable.addGlobalSecondaryIndex({
          indexName: 'byDate',
          partitionKey: { name: 'date', type: AttributeType.STRING },
          sortKey: { name: 'createdAt', type: AttributeType.NUMBER },
          readCapacity: 5,
          writeCapacity: 5,
        });
        for (const cfnResource of storageGsiTableStack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              c.cfnResourceType === 'AWS::DynamoDB::Table'
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
        return GsiTable;
      }

      export function postRefactor(GsiTable: Table) {
        (GsiTable.node.defaultChild as CfnTable).tableName = 'GsiTable-abc';
      }
      "
    `);
  });

  it('handles BINARY attribute type', async () => {
    const gen1App = await createGen1App({
      providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
      storage: {
        binaryTable: {
          service: 'DynamoDB',
          output: { Name: 'BinaryTable-abc' },
        },
      },
    });
    jest.spyOn(gen1App.aws, 'fetchTableDescription').mockResolvedValue({
      KeySchema: [{ AttributeName: 'data', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'data', AttributeType: 'B' }],
      BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
      ProvisionedThroughput: {},
    });

    const generator = new DynamoDBGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      {
        category: 'storage',
        resourceName: 'binaryTable',
        service: 'DynamoDB',
        key: 'storage:DynamoDB',
      },
      logger,
    );
    const ops = await generator.plan();
    await ops[0].execute();

    expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
      "import type { Backend } from '../../backend';
      import {
        Table,
        AttributeType,
        BillingMode,
        StreamViewType,
        CfnTable,
      } from 'aws-cdk-lib/aws-dynamodb';
      import { CfnResource } from 'aws-cdk-lib';

      export function defineStorageBinaryTable(backend: Backend) {
        const storageBinaryTableStack = backend.createStack('storagebinaryTable');
        new Table(storageBinaryTableStack, 'BinaryTable', {
          partitionKey: { name: 'data', type: AttributeType.BINARY },
          billingMode: BillingMode.PAY_PER_REQUEST,
        });
        for (const cfnResource of storageBinaryTableStack.node
          .findAll()
          .filter(
            (c) =>
              CfnResource.isCfnResource(c) &&
              c.cfnResourceType === 'AWS::DynamoDB::Table'
          )) {
          (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
          (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
        }
      }

      export function postRefactor(BinaryTable: Table) {
        (BinaryTable.node.defaultChild as CfnTable).tableName = 'BinaryTable-abc';
      }
      "
    `);
  });
});
