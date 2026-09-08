import path from 'node:path';
import fs from 'node:fs/promises';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { DynamoDBRenderer, DynamoDBGSI, DynamoDBTableDefinition } from './dynamodb.renderer';
import { TS } from '../../ts';
import { TableDescription, KeySchemaElement, AttributeDefinition } from '@aws-sdk/client-dynamodb';
import { SpinningLogger } from '../../../_common/spinning-logger';

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
  private readonly resource: DiscoveredResource;
  private readonly outputDir: string;
  private readonly renderer: DynamoDBRenderer;
  private readonly logger: SpinningLogger;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    outputDir: string,
    resource: DiscoveredResource,
    logger: SpinningLogger,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.renderer = new DynamoDBRenderer(resource.resourceName);
    this.logger = logger;
  }

  /**
   * Plans the DynamoDB table generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const table = await this.fetchTable();

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/storage/${this.resource.resourceName}/resource.ts`],
        execute: async () => {
          const capitalizedName = this.resource.resourceName.charAt(0).toUpperCase() + this.resource.resourceName.slice(1);
          const functionName = `defineStorage${capitalizedName}`;

          // Write the resource.ts file for this DynamoDB table
          const resourceDir = path.join(this.outputDir, 'amplify', 'storage', this.resource.resourceName);
          this.logger.info(`Rendering storage/${this.resource.resourceName}/resource.ts`);
          const nodes = this.renderer.render(table);
          const content = TS.printNodes(nodes);
          await fs.mkdir(resourceDir, { recursive: true });
          await fs.writeFile(path.join(resourceDir, 'resource.ts'), content, 'utf-8');

          // Contribute to backend.ts
          const storageAlias = this.backendGenerator.reserveAlias(`storage${capitalizedName}`, 'storage');
          this.backendGenerator.addNamespaceImport(storageAlias, `./storage/${this.resource.resourceName}/resource`);
          this.backendGenerator.addPostDefineBackendCall(this.resource.resourceName, `${storageAlias}.${functionName}(backend)`);
          this.backendGenerator.addPostRefactorCall(`${storageAlias}.postRefactor(${this.resource.resourceName});`);
        },
      },
    ];
  }

  private async fetchTable(): Promise<DynamoDBTableDefinition> {
    const actualTableName = this.gen1App.resourceMetaOutput(this.resource, 'Name');

    this.logger.debug(`Fetching DynamoDB table '${actualTableName}'`);
    const table = await this.gen1App.aws.fetchTableDescription(actualTableName);
    if (!table) {
      throw new AmplifyError('DynamoDBTableNotFoundError', {
        message: `DynamoDB table '${actualTableName}' not found`,
        resolution: 'Verify the DynamoDB table exists and the CLI has the correct AWS credentials and region configured.',
      });
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
        throw new AmplifyError('DynamoDBSchemaError', {
          message: `GSI on table '${actualTableName}' has no IndexName`,
          resolution: 'Verify the DynamoDB table GSI configuration is valid.',
        });
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
    throw new AmplifyError('DynamoDBSchemaError', {
      message: `${keyType} key not found in KeySchema for '${context}'`,
      resolution: 'Verify the DynamoDB table key schema is valid.',
    });
  }
  const attrDef = attributeDefinitions.find((a) => a.AttributeName === keyElement.AttributeName);
  if (!attrDef?.AttributeType) {
    throw new AmplifyError('DynamoDBSchemaError', {
      message: `Attribute definition for '${keyElement.AttributeName}' not found in '${context}'`,
      resolution: 'Verify the DynamoDB table attribute definitions match the key schema.',
    });
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
