import { Planner } from '../../../planner';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../_infra/gen1-app';
import { DynamoDBRenderer, DynamoDBGSI, DynamoDBTableDefinition } from './dynamodb.renderer';
import { TableDescription, KeySchemaElement, AttributeDefinition } from '@aws-sdk/client-dynamodb';

/**
 * Generates a single DynamoDB table construct and contributes it to backend.ts.
 *
 * Fetches the table definition via DescribeTable and renders a CDK Table
 * construct (with GSIs) as an early statement in backend.ts. The shared
 * `storageStack` declaration is emitted once via BackendGenerator.ensureStorageStack().
 */
export class DynamoDBGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly resourceName: string;
  private readonly hasS3Bucket: boolean;
  private readonly renderer = new DynamoDBRenderer();

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, resourceName: string, hasS3Bucket: boolean) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.resourceName = resourceName;
    this.hasS3Bucket = hasS3Bucket;
  }

  /**
   * Plans the DynamoDB table generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const table = await this.fetchTable();

    return [
      {
        validate: async () => {
          return;
        },
        describe: async () => [`Generate DynamoDB table ${this.resourceName} in amplify/backend.ts`],
        execute: async () => {
          const imports = this.renderer.requiredImports();
          this.backendGenerator.addImport(imports.source, imports.identifiers);
          const scopeVarName = this.backendGenerator.createDynamoDBStack(this.resourceName);

          for (const statement of this.renderer.renderTable(table, scopeVarName)) {
            this.backendGenerator.addEarlyStatement(statement);
          }
        },
      },
    ];
  }

  private async fetchTable(): Promise<DynamoDBTableDefinition> {
    const storageMeta = this.gen1App.meta('storage');
    const resourceMeta = storageMeta?.[this.resourceName] as Record<string, unknown> | undefined;
    const output = resourceMeta?.output as Record<string, string> | undefined;
    const actualTableName = output?.Name || this.resourceName;

    const table = await this.gen1App.aws.fetchTableDescription(actualTableName);
    if (!table) {
      throw new Error(`DynamoDB table '${actualTableName}' not found`);
    }

    const partitionKey = extractKey(table, 'HASH');
    const sortKey = table.KeySchema?.some((k) => k.KeyType === 'RANGE') ? extractKey(table, 'RANGE') : undefined;

    const gsis: DynamoDBGSI[] = (table.GlobalSecondaryIndexes ?? []).map((gsi) => {
      const keySchema = gsi.KeySchema ?? [];
      const gsiPartitionKey = extractKeyFromSchema(keySchema, table.AttributeDefinitions ?? [], 'HASH', gsi.IndexName ?? 'unknown');
      const gsiSortKeySchema = keySchema.find((k) => k.KeyType === 'RANGE');
      const gsiSortKey = gsiSortKeySchema
        ? extractKeyFromSchema(keySchema, table.AttributeDefinitions ?? [], 'RANGE', gsi.IndexName ?? 'unknown')
        : undefined;

      if (!gsi.IndexName) {
        throw new Error(`GSI on table '${actualTableName}' has no IndexName`);
      }
      return { indexName: gsi.IndexName, partitionKey: gsiPartitionKey, sortKey: gsiSortKey };
    });

    return {
      tableName: actualTableName,
      partitionKey,
      sortKey,
      gsis: gsis.length > 0 ? gsis : undefined,
      billingMode: table.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST' ? 'PAY_PER_REQUEST' : 'PROVISIONED',
      readCapacity: table.ProvisionedThroughput?.ReadCapacityUnits || 5,
      writeCapacity: table.ProvisionedThroughput?.WriteCapacityUnits || 5,
      streamEnabled: !!table.StreamSpecification?.StreamEnabled,
      streamViewType: table.StreamSpecification?.StreamViewType as DynamoDBTableDefinition['streamViewType'],
    };
  }
}

/**
 * Extracts a key attribute (HASH or RANGE) from a table's KeySchema and AttributeDefinitions.
 */
function extractKey(
  table: TableDescription,
  keyType: 'HASH' | 'RANGE',
): { readonly name: string; readonly type: 'STRING' | 'NUMBER' | 'BINARY' } {
  return extractKeyFromSchema(table.KeySchema ?? [], table.AttributeDefinitions ?? [], keyType, table.TableName ?? 'unknown');
}

/**
 * Extracts a key attribute from a KeySchema and AttributeDefinitions array.
 */
function extractKeyFromSchema(
  keySchema: KeySchemaElement[],
  attributeDefinitions: AttributeDefinition[],
  keyType: 'HASH' | 'RANGE',
  context: string,
): { readonly name: string; readonly type: 'STRING' | 'NUMBER' | 'BINARY' } {
  const keyElement = keySchema.find((k) => k.KeyType === keyType);
  if (!keyElement?.AttributeName) {
    throw new Error(`${keyType} key not found in KeySchema for '${context}'`);
  }
  const attrDef = attributeDefinitions.find((a) => a.AttributeName === keyElement.AttributeName);
  if (!attrDef?.AttributeType) {
    throw new Error(`Attribute definition for '${keyElement.AttributeName}' not found in '${context}'`);
  }
  return { name: keyElement.AttributeName, type: mapAttributeType(attrDef.AttributeType) };
}

function mapAttributeType(dynamoType: string): 'STRING' | 'NUMBER' | 'BINARY' {
  switch (dynamoType) {
    case 'S':
      return 'STRING';
    case 'N':
      return 'NUMBER';
    case 'B':
      return 'BINARY';
    default:
      return 'STRING';
  }
}
