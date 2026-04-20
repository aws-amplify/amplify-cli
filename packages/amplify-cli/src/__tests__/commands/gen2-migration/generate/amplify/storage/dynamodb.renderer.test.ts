import {
  DynamoDBRenderer,
  DynamoDBTableDefinition,
} from '../../../../../../commands/gen2-migration/generate/amplify/storage/dynamodb.renderer';
import { TS } from '../../../../../../commands/gen2-migration/generate/_infra/ts';

describe('DynamoDBRenderer', () => {
  function renderTable(resourceName: string, table: DynamoDBTableDefinition): string {
    const renderer = new DynamoDBRenderer(resourceName);
    const nodes = renderer.render(table);
    return TS.printNodes(nodes);
  }

  describe('render', () => {
    it('renders a basic table with partition key', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'MyTable-abc123',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };
      const output = renderTable('myTable', table);

      expect(output).toContain('new Table');
      expect(output).toContain('AttributeType.STRING');
      expect(output).toContain('BillingMode.PAY_PER_REQUEST');
      expect(output).toContain('defineStorageMyTable');
    });

    it('renders a table with sort key and provisioned billing', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'MyTable-abc123',
        partitionKey: { name: 'pk', type: 'STRING' },
        sortKey: { name: 'sk', type: 'NUMBER' },
        billingMode: 'PROVISIONED',
        readCapacity: 10,
        writeCapacity: 5,
      };
      const output = renderTable('myTable', table);

      expect(output).toContain('AttributeType.STRING');
      expect(output).toContain('AttributeType.NUMBER');
      expect(output).toContain('BillingMode.PROVISIONED');
      expect(output).toContain('readCapacity: 10');
      expect(output).toContain('writeCapacity: 5');
      expect(output).toContain('sortKey');
    });

    it('renders stream configuration', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'StreamTable-abc',
        partitionKey: { name: 'id', type: 'STRING' },
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
      };
      const output = renderTable('streamTable', table);

      expect(output).toContain('StreamViewType.NEW_AND_OLD_IMAGES');
    });

    it('does not render stream when disabled', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'NoStream-abc',
        partitionKey: { name: 'id', type: 'STRING' },
        streamEnabled: false,
      };
      const output = renderTable('noStream', table);

      // StreamViewType appears in imports but should not appear in the table properties
      const afterImports = output.split("from 'aws-cdk-lib/aws-dynamodb'")[1] || '';
      expect(afterImports).not.toContain('StreamViewType.');
    });

    it('renders GSIs with addGlobalSecondaryIndex calls', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'GsiTable-abc',
        partitionKey: { name: 'id', type: 'STRING' },
        gsis: [
          {
            indexName: 'byStatus',
            partitionKey: { name: 'status', type: 'STRING' },
          },
          {
            indexName: 'byDate',
            partitionKey: { name: 'date', type: 'STRING' },
            sortKey: { name: 'createdAt', type: 'NUMBER' },
          },
        ],
      };
      const output = renderTable('gsiTable', table);

      expect(output).toContain('addGlobalSecondaryIndex');
      expect(output).toContain("'byStatus'");
      expect(output).toContain("'byDate'");
      expect(output).toContain("'createdAt'");
    });

    it('omits read/write capacity for PAY_PER_REQUEST billing', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'OnDemand-abc',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
        readCapacity: 10,
        writeCapacity: 5,
      };
      const output = renderTable('onDemand', table);

      expect(output).not.toContain('readCapacity');
      expect(output).not.toContain('writeCapacity');
    });

    it('handles BINARY attribute type', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'BinaryTable-abc',
        partitionKey: { name: 'data', type: 'BINARY' },
      };
      const output = renderTable('binaryTable', table);

      expect(output).toContain('AttributeType.BINARY');
    });

    it('renders postRefactor function', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'MyTable-abc123',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };
      const output = renderTable('myTable', table);

      expect(output).toContain('postRefactor');
      expect(output).toContain('CfnTable');
    });

    it('renders Backend type import', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'MyTable-abc123',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };
      const output = renderTable('myTable', table);

      expect(output).toContain('Backend');
      expect(output).toContain('../../backend');
    });
  });
});
