import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { DynamoDBRenderer, DynamoDBTableDefinition } from './dynamodb.renderer';

/**
 * Generates DynamoDB table constructs and contributes them to backend.ts.
 *
 * For each DynamoDB resource in the Gen1 storage category, fetches the
 * table definition via DescribeTable and renders CDK Table constructs
 * (with GSIs) into backend.ts.
 */
export class DynamoDBGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly defineTable: DynamoDBRenderer;
  private readonly hasS3Bucket: boolean;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, hasS3Bucket: boolean) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.defineTable = new DynamoDBRenderer();
    this.hasS3Bucket = hasS3Bucket;
  }

  /**
   * Plans the DynamoDB table generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const storageCategory = await this.gen1App.fetchMetaCategory('storage');
    if (!storageCategory) return [];

    const dynamoEntries = Object.entries(storageCategory).filter(([, value]) => (value as Record<string, unknown>).service === 'DynamoDB');
    if (dynamoEntries.length === 0) return [];

    const tables: DynamoDBTableDefinition[] = [];
    for (const [storageName, storageValue] of dynamoEntries) {
      tables.push(await this.fetchTable(storageName, storageValue as Record<string, unknown>));
    }

    return [
      {
        describe: async () => ['Generate DynamoDB table constructs in backend.ts'],
        execute: async () => {
          const imports = this.defineTable.requiredImports();
          this.backendGenerator.addImport(imports.source, imports.identifiers);

          const statements = this.defineTable.render({ tables, hasS3Bucket: this.hasS3Bucket });
          for (const stmt of statements) {
            this.backendGenerator.addEarlyStatement(stmt);
          }
        },
      },
    ];
  }

  private async fetchTable(storageName: string, storageMeta: Record<string, unknown>): Promise<DynamoDBTableDefinition> {
    const output = storageMeta.output as Record<string, string> | undefined;
    const actualTableName = output?.Name || storageName;

    const table = await this.gen1App.aws.fetchTableDescription(actualTableName);
    if (!table) {
      throw new Error(`DynamoDB table '${actualTableName}' not found`);
    }

    const partitionKey = {
      name: table.KeySchema!.find((k) => k.KeyType === 'HASH')!.AttributeName!,
      type: mapAttributeType(
        table.AttributeDefinitions!.find((a) => a.AttributeName === table.KeySchema!.find((k) => k.KeyType === 'HASH')!.AttributeName)!
          .AttributeType!,
      ),
    };

    let sortKey: DynamoDBTableDefinition['sortKey'];
    const sortKeySchema = table.KeySchema!.find((k) => k.KeyType === 'RANGE');
    if (sortKeySchema) {
      sortKey = {
        name: sortKeySchema.AttributeName!,
        type: mapAttributeType(table.AttributeDefinitions!.find((a) => a.AttributeName === sortKeySchema.AttributeName)!.AttributeType!),
      };
    }

    const gsis: DynamoDBTableDefinition['gsis'] = [];
    if (table.GlobalSecondaryIndexes) {
      for (const gsi of table.GlobalSecondaryIndexes) {
        const gsiPartitionKey = {
          name: gsi.KeySchema!.find((k) => k.KeyType === 'HASH')!.AttributeName!,
          type: mapAttributeType(
            table.AttributeDefinitions!.find((a) => a.AttributeName === gsi.KeySchema!.find((k) => k.KeyType === 'HASH')!.AttributeName)!
              .AttributeType!,
          ),
        };
        const gsiSortKeySchema = gsi.KeySchema!.find((k) => k.KeyType === 'RANGE');
        const gsiSortKey = gsiSortKeySchema
          ? {
              name: gsiSortKeySchema.AttributeName!,
              type: mapAttributeType(
                table.AttributeDefinitions!.find((a) => a.AttributeName === gsiSortKeySchema.AttributeName)!.AttributeType!,
              ),
            }
          : undefined;

        gsis.push({ indexName: gsi.IndexName!, partitionKey: gsiPartitionKey, sortKey: gsiSortKey });
      }
    }

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
