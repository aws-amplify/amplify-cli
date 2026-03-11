import ts from 'typescript';
import {
  DynamoDBRenderer,
  DynamoDBTableDefinition,
} from '../../../../../../commands/gen2-migration/generate-new/output/storage/dynamodb.renderer';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

function printStatements(statements: ts.Statement[]): string {
  return statements.map((s) => printer.printNode(ts.EmitHint.Unspecified, s, sourceFile)).join('\n');
}

describe('DynamoDBRenderer', () => {
  const renderer = new DynamoDBRenderer();

  describe('requiredImports', () => {
    it('returns aws-cdk-lib/aws-dynamodb imports', () => {
      const imports = renderer.requiredImports();
      expect(imports.source).toBe('aws-cdk-lib/aws-dynamodb');
      expect(imports.identifiers).toContain('Table');
      expect(imports.identifiers).toContain('AttributeType');
      expect(imports.identifiers).toContain('BillingMode');
      expect(imports.identifiers).toContain('StreamViewType');
    });
  });

  describe('renderTable', () => {
    it('renders a basic table with partition key', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'MyTable-abc123',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).toContain('"MyTable"');
      expect(output).toContain('storageStack');
      expect(output).toContain('name: "id"');
      expect(output).toContain('AttributeType.STRING');
      expect(output).toContain('BillingMode.PAY_PER_REQUEST');
    });

    it('renders a table with sort key', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'MyTable-abc123',
        partitionKey: { name: 'pk', type: 'STRING' },
        sortKey: { name: 'sk', type: 'NUMBER' },
        billingMode: 'PROVISIONED',
        readCapacity: 10,
        writeCapacity: 5,
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).toContain('name: "sk"');
      expect(output).toContain('AttributeType.NUMBER');
      expect(output).toContain('readCapacity: 10');
      expect(output).toContain('writeCapacity: 5');
    });

    it('renders stream configuration', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'StreamTable-abc',
        partitionKey: { name: 'id', type: 'STRING' },
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).toContain('StreamViewType.NEW_AND_OLD_IMAGES');
    });

    it('does not render stream when disabled', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'NoStream-abc',
        partitionKey: { name: 'id', type: 'STRING' },
        streamEnabled: false,
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).not.toContain('StreamViewType');
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
      const output = printStatements(renderer.renderTable(table));

      expect(output).toContain('addGlobalSecondaryIndex');
      expect(output).toContain('indexName: "byStatus"');
      expect(output).toContain('indexName: "byDate"');
      expect(output).toContain('name: "createdAt"');
    });

    it('uses const variable when GSIs exist for chaining', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'GsiTable-abc',
        partitionKey: { name: 'id', type: 'STRING' },
        gsis: [{ indexName: 'idx', partitionKey: { name: 'pk', type: 'STRING' } }],
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).toContain('const GsiTable');
    });

    it('uses expression statement (no variable) when no GSIs', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'SimpleTable-abc',
        partitionKey: { name: 'id', type: 'STRING' },
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).not.toContain('const SimpleTable');
      expect(output).toContain('new Table');
    });

    it('omits read/write capacity for PAY_PER_REQUEST billing', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'OnDemand-abc',
        partitionKey: { name: 'id', type: 'STRING' },
        billingMode: 'PAY_PER_REQUEST',
        readCapacity: 10,
        writeCapacity: 5,
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).not.toContain('readCapacity');
      expect(output).not.toContain('writeCapacity');
    });

    it('includes a post-refactor table name comment', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'MyTable-abc123',
        partitionKey: { name: 'id', type: 'STRING' },
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).toContain("tableName: 'MyTable-abc123'");
    });

    it('sanitizes table name for variable name', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'my-special.table-abc',
        partitionKey: { name: 'id', type: 'STRING' },
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).toContain('my_special_table');
    });

    it('handles BINARY attribute type', () => {
      const table: DynamoDBTableDefinition = {
        tableName: 'BinaryTable-abc',
        partitionKey: { name: 'data', type: 'BINARY' },
      };
      const output = printStatements(renderer.renderTable(table));

      expect(output).toContain('AttributeType.BINARY');
    });
  });
});
