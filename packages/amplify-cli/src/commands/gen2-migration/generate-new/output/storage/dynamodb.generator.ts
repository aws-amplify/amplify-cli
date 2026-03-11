import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { DynamoDBRenderer, DynamoDBGSI, DynamoDBTableDefinition } from './dynamodb.renderer';

/**
 * Generates a single DynamoDB table construct and contributes it to backend.ts.
 *
 * Fetches the table definition via DescribeTable and renders a CDK Table
 * construct (with GSIs) as an early statement in backend.ts. The shared
 * `storageStack` declaration is emitted once via BackendGenerator.ensureStorageStack().
 */
export class DynamoDBGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly resourceName: string;
  private readonly renderer: DynamoDBRenderer;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, resourceName: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.resourceName = resourceName;
    this.renderer = new DynamoDBRenderer();
  }

  /**
   * Plans the DynamoDB table generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const storageCategory = await this.gen1App.fetchMetaCategory('storage');
    if (!storageCategory) return [];

    const resourceMeta = storageCategory[this.resourceName] as Record<string, unknown> | undefined;
    if (!resourceMeta) return [];

    const table = await this.fetchTable(resourceMeta);
    const hasS3Bucket = Object.values(storageCategory).some((v) => (v as Record<string, unknown>).service === 'S3');

    return [
      {
        describe: async () => [`Generate DynamoDB table ${this.resourceName} in amplify/backend.ts`],
        execute: async () => {
          const imports = this.renderer.requiredImports();
          this.backendGenerator.addImport(imports.source, imports.identifiers);
          this.backendGenerator.ensureStorageStack(hasS3Bucket);

          const statements = this.renderer.renderTable(table);
          for (const stmt of statements) {
            this.backendGenerator.addEarlyStatement(stmt);
          }
        },
      },
    ];
  }

  private async fetchTable(storageMeta: Record<string, unknown>): Promise<DynamoDBTableDefinition> {
    const output = storageMeta.output as Record<string, string> | undefined;
    const actualTableName = output?.Name || this.resourceName;

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

    const gsis: DynamoDBGSI[] = [];
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
