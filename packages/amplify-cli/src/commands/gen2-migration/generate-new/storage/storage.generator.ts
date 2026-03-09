import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import type { BucketAccelerateStatus, BucketVersioningStatus, ServerSideEncryptionConfiguration } from '@aws-sdk/client-s3';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { printNodes } from '../ts-writer';
import { StorageRenderer, AccessPatterns, Lambda, StorageTriggerEvent, Permission } from './storage.renderer';

const factory = ts.factory;

/**
 * DynamoDB attribute definition.
 */
interface DynamoDBAttribute {
  readonly name: string;
  readonly type: 'STRING' | 'NUMBER' | 'BINARY';
}

/**
 * DynamoDB Global Secondary Index definition.
 */
interface DynamoDBGSI {
  readonly indexName: string;
  readonly partitionKey: DynamoDBAttribute;
  readonly sortKey?: DynamoDBAttribute;
}

/**
 * DynamoDB table definition extracted from AWS.
 */
interface DynamoDBTableDefinition {
  readonly tableName: string;
  readonly partitionKey: DynamoDBAttribute;
  readonly sortKey?: DynamoDBAttribute;
  readonly gsis?: DynamoDBGSI[];
  readonly billingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST';
  readonly readCapacity?: number;
  readonly writeCapacity?: number;
  readonly streamEnabled?: boolean;
  readonly streamViewType?: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES';
}

/**
 * CLI v1 permission types from cli-inputs.json.
 */
type CLIV1Permission = 'READ' | 'CREATE_AND_UPDATE' | 'DELETE';

/**
 * Storage CLI inputs JSON shape.
 */
interface StorageCLIInputsJSON {
  readonly resourceName?: string;
  readonly bucketName?: string;
  readonly storageAccess?: string;
  readonly guestAccess: CLIV1Permission[];
  readonly authAccess: CLIV1Permission[];
  readonly triggerFunction?: string;
  readonly groupAccess?: Record<string, CLIV1Permission[]>;
}

const PERMISSION_MAP: Record<CLIV1Permission, Permission[]> = {
  READ: ['read'],
  DELETE: ['delete'],
  CREATE_AND_UPDATE: ['write'],
};

/**
 * Generates S3 and DynamoDB storage resources and contributes to backend.ts.
 *
 * For S3: reads bucket config (notifications, acceleration, versioning,
 * encryption) via Gen1App.aws, reads cli-inputs.json for access patterns,
 * and generates amplify/storage/resource.ts with defineStorage().
 *
 * For DynamoDB: fetches table definitions via DescribeTable and contributes
 * CDK Table constructs to backend.ts.
 */
export class StorageGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly defineStorage: StorageRenderer;
  private readonly functionNamesAndCategories: Map<string, string>;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    outputDir: string,
    functionNamesAndCategories: Map<string, string>,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.defineStorage = new StorageRenderer(gen1App.envName);
    this.functionNamesAndCategories = functionNamesAndCategories;
  }

  /**
   * Plans the storage generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const storageCategory = await this.gen1App.fetchMetaCategory('storage');
    if (!storageCategory) {
      return [];
    }

    const meta = await this.gen1App.fetchMeta();
    const functionNames = meta.function ? Object.keys(meta.function as object) : [];

    const operations: AmplifyMigrationOperation[] = [];
    const dynamoTables: DynamoDBTableDefinition[] = [];
    let s3Operation: AmplifyMigrationOperation | undefined;

    for (const [storageName, storageValue] of Object.entries(storageCategory)) {
      const storageMeta = storageValue as Record<string, unknown>;
      const service = storageMeta.service as string;

      if (service === 'S3') {
        s3Operation = await this.planS3(storageName, storageMeta, functionNames);
      } else if (service === 'DynamoDB') {
        const tableDef = await this.fetchDynamoDBTable(storageName, storageMeta);
        dynamoTables.push(tableDef);
      }
    }

    if (s3Operation) {
      operations.push(s3Operation);
    }

    if (dynamoTables.length > 0) {
      operations.push(this.planDynamoDBBackendContributions(dynamoTables, !!s3Operation));
    }

    return operations;
  }

  private async planS3(
    storageName: string,
    storageMeta: Record<string, unknown>,
    functionNames: string[],
  ): Promise<AmplifyMigrationOperation> {
    const output = storageMeta.output as Record<string, string> | undefined;
    const bucketName = output?.BucketName;
    if (!bucketName) {
      throw new Error(`Could not find bucket name for storage resource '${storageName}'`);
    }

    const cliInputs = await this.gen1App.readCloudBackendJson<StorageCLIInputsJSON>(`storage/${storageName}/cli-inputs.json`);
    if (!cliInputs) {
      throw new Error(`Could not find cli-inputs.json for ${storageName}`);
    }

    const [notifications, accelerateStatus, versioningStatus, encryption] = await Promise.all([
      this.gen1App.aws.fetchBucketNotifications(bucketName),
      this.gen1App.aws.fetchBucketAccelerate(bucketName),
      this.gen1App.aws.fetchBucketVersioning(bucketName),
      this.gen1App.aws.fetchBucketEncryption(bucketName),
    ]);

    const triggers = this.extractStorageTriggers(notifications);
    const accessPatterns = this.buildAccessPatterns(cliInputs, functionNames);
    const storageDir = path.join(this.outputDir, 'amplify', 'storage');
    const storageIdentifier = cliInputs.bucketName || storageName;

    return {
      describe: async () => ['Generate storage/resource.ts'],
      execute: async () => {
        const nodes = this.defineStorage.render({
          storageIdentifier,
          accessPatterns,
          triggers,
          functionNamesAndCategories: this.functionNamesAndCategories,
        });

        const content = printNodes(nodes);
        await fs.mkdir(storageDir, { recursive: true });
        await fs.writeFile(path.join(storageDir, 'resource.ts'), content, 'utf-8');

        // Contribute to backend.ts
        this.backendGenerator.addImport('./storage/resource', ['storage']);
        this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier('storage')));

        // S3 bucket overrides
        this.contributeS3Overrides(bucketName, accelerateStatus, versioningStatus, encryption);
      },
    };
  }

  private contributeS3Overrides(
    bucketName: string,
    accelerateStatus: BucketAccelerateStatus | undefined,
    versioningStatus: BucketVersioningStatus | undefined,
    encryption: ServerSideEncryptionConfiguration | undefined,
  ): void {
    // const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
    const cfnBucketDecl = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            's3Bucket',
            undefined,
            undefined,
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('storage')),
                  factory.createIdentifier('resources'),
                ),
                factory.createIdentifier('cfnResources'),
              ),
              factory.createIdentifier('cfnBucket'),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    this.backendGenerator.addStatement(cfnBucketDecl);

    // Bucket name comment
    const bucketNameComment1 = factory.createNotEmittedStatement(factory.createStringLiteral(''));
    ts.addSyntheticLeadingComment(bucketNameComment1, ts.SyntaxKind.SingleLineCommentTrivia, ' Use this bucket name post refactor', true);
    const bucketNameComment2 = factory.createNotEmittedStatement(factory.createStringLiteral(''));
    ts.addSyntheticLeadingComment(
      bucketNameComment2,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` s3Bucket.bucketName = '${bucketName}';`,
      true,
    );
    this.backendGenerator.addStatement(bucketNameComment1 as unknown as ts.Statement);
    this.backendGenerator.addStatement(bucketNameComment2 as unknown as ts.Statement);

    if (accelerateStatus) {
      this.backendGenerator.addStatement(
        factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('s3Bucket'),
              factory.createIdentifier('accelerateConfiguration'),
            ),
            factory.createObjectLiteralExpression(
              [factory.createPropertyAssignment('accelerationStatus', factory.createStringLiteral(accelerateStatus))],
              false,
            ),
          ),
        ),
      );
    }

    if (versioningStatus) {
      this.backendGenerator.addStatement(
        factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('s3Bucket'),
              factory.createIdentifier('versioningConfiguration'),
            ),
            factory.createObjectLiteralExpression(
              [factory.createPropertyAssignment('status', factory.createStringLiteral(versioningStatus))],
              false,
            ),
          ),
        ),
      );
    }

    if (encryption?.Rules?.[0]) {
      const rule = encryption.Rules[0];
      const sseProps: ts.PropertyAssignment[] = [];
      if (rule.ApplyServerSideEncryptionByDefault) {
        const sseDefaultProps: ts.PropertyAssignment[] = [];
        if (rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm) {
          sseDefaultProps.push(
            factory.createPropertyAssignment(
              'sseAlgorithm',
              factory.createStringLiteral(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm),
            ),
          );
        }
        if (rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID) {
          sseDefaultProps.push(
            factory.createPropertyAssignment(
              'kmsMasterKeyId',
              factory.createStringLiteral(rule.ApplyServerSideEncryptionByDefault.KMSMasterKeyID),
            ),
          );
        }
        sseProps.push(
          factory.createPropertyAssignment('serverSideEncryptionByDefault', factory.createObjectLiteralExpression(sseDefaultProps, true)),
        );
      }
      if (rule.BucketKeyEnabled !== undefined) {
        sseProps.push(
          factory.createPropertyAssignment('bucketKeyEnabled', rule.BucketKeyEnabled ? factory.createTrue() : factory.createFalse()),
        );
      }

      this.backendGenerator.addStatement(
        factory.createExpressionStatement(
          factory.createAssignment(
            factory.createPropertyAccessExpression(factory.createIdentifier('s3Bucket'), factory.createIdentifier('bucketEncryption')),
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  'serverSideEncryptionConfiguration',
                  factory.createArrayLiteralExpression([factory.createObjectLiteralExpression(sseProps, true)], true),
                ),
              ],
              true,
            ),
          ),
        ),
      );
    }
  }

  private planDynamoDBBackendContributions(dynamoTables: DynamoDBTableDefinition[], hasS3Bucket: boolean): AmplifyMigrationOperation {
    return {
      describe: async () => ['Generate DynamoDB table constructs in backend.ts'],
      execute: async () => {
        // Add CDK imports
        this.backendGenerator.addImport('aws-cdk-lib/aws-dynamodb', ['Table', 'AttributeType', 'BillingMode', 'StreamViewType']);

        // Create storage stack
        const stackExpression = hasS3Bucket
          ? factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('storage')),
              factory.createIdentifier('stack'),
            )
          : factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('createStack')),
              undefined,
              [factory.createStringLiteral('storage')],
            );

        this.backendGenerator.addStatement(
          factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [factory.createVariableDeclaration('storageStack', undefined, undefined, stackExpression)],
              ts.NodeFlags.Const,
            ),
          ),
        );

        for (const table of dynamoTables) {
          this.contributeDynamoDBTable(table);
        }
      },
    };
  }

  private contributeDynamoDBTable(table: DynamoDBTableDefinition): void {
    const baseTableName = table.tableName.replace(/-[^-]+$/, '');
    const sanitizedName = sanitizeVariableName(baseTableName);

    const tableProps: ts.PropertyAssignment[] = [
      factory.createPropertyAssignment(
        'partitionKey',
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment('name', factory.createStringLiteral(table.partitionKey.name)),
          factory.createPropertyAssignment(
            'type',
            factory.createPropertyAccessExpression(
              factory.createIdentifier('AttributeType'),
              factory.createIdentifier(table.partitionKey.type),
            ),
          ),
        ]),
      ),
      factory.createPropertyAssignment(
        'billingMode',
        factory.createPropertyAccessExpression(
          factory.createIdentifier('BillingMode'),
          factory.createIdentifier(table.billingMode || 'PROVISIONED'),
        ),
      ),
    ];

    if (table.billingMode !== 'PAY_PER_REQUEST') {
      tableProps.push(factory.createPropertyAssignment('readCapacity', factory.createNumericLiteral(String(table.readCapacity || 5))));
      tableProps.push(factory.createPropertyAssignment('writeCapacity', factory.createNumericLiteral(String(table.writeCapacity || 5))));
    }

    if (table.streamEnabled && table.streamViewType) {
      tableProps.push(
        factory.createPropertyAssignment(
          'stream',
          factory.createPropertyAccessExpression(
            factory.createIdentifier('StreamViewType'),
            factory.createIdentifier(table.streamViewType),
          ),
        ),
      );
    }

    if (table.sortKey) {
      tableProps.push(
        factory.createPropertyAssignment(
          'sortKey',
          factory.createObjectLiteralExpression([
            factory.createPropertyAssignment('name', factory.createStringLiteral(table.sortKey.name)),
            factory.createPropertyAssignment(
              'type',
              factory.createPropertyAccessExpression(
                factory.createIdentifier('AttributeType'),
                factory.createIdentifier(table.sortKey.type),
              ),
            ),
          ]),
        ),
      );
    }

    const hasGSIs = table.gsis && table.gsis.length > 0;

    if (hasGSIs) {
      this.backendGenerator.addStatement(
        factory.createVariableStatement(
          [],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                sanitizedName,
                undefined,
                undefined,
                factory.createNewExpression(factory.createIdentifier('Table'), undefined, [
                  factory.createIdentifier('storageStack'),
                  factory.createStringLiteral(sanitizedName),
                  factory.createObjectLiteralExpression(tableProps),
                ]),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
      );
    } else {
      this.backendGenerator.addStatement(
        factory.createExpressionStatement(
          factory.createNewExpression(factory.createIdentifier('Table'), undefined, [
            factory.createIdentifier('storageStack'),
            factory.createStringLiteral(sanitizedName),
            factory.createObjectLiteralExpression(tableProps),
          ]),
        ),
      );
    }

    // Table name comment
    const tableNameComment = factory.createNotEmittedStatement(factory.createStringLiteral(''));
    ts.addSyntheticLeadingComment(
      tableNameComment,
      ts.SyntaxKind.SingleLineCommentTrivia,
      ` Add this property to the Table above post refactor: tableName: '${table.tableName}'`,
      true,
    );
    this.backendGenerator.addStatement(tableNameComment as unknown as ts.Statement);

    // Add GSIs
    if (table.gsis) {
      for (const gsi of table.gsis) {
        const gsiProps: ts.PropertyAssignment[] = [
          factory.createPropertyAssignment('indexName', factory.createStringLiteral(gsi.indexName)),
          factory.createPropertyAssignment(
            'partitionKey',
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment('name', factory.createStringLiteral(gsi.partitionKey.name)),
              factory.createPropertyAssignment(
                'type',
                factory.createPropertyAccessExpression(
                  factory.createIdentifier('AttributeType'),
                  factory.createIdentifier(gsi.partitionKey.type),
                ),
              ),
            ]),
          ),
        ];

        if (gsi.sortKey) {
          gsiProps.push(
            factory.createPropertyAssignment(
              'sortKey',
              factory.createObjectLiteralExpression([
                factory.createPropertyAssignment('name', factory.createStringLiteral(gsi.sortKey.name)),
                factory.createPropertyAssignment(
                  'type',
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier('AttributeType'),
                    factory.createIdentifier(gsi.sortKey.type),
                  ),
                ),
              ]),
            ),
          );
        }

        gsiProps.push(factory.createPropertyAssignment('readCapacity', factory.createNumericLiteral('5')));
        gsiProps.push(factory.createPropertyAssignment('writeCapacity', factory.createNumericLiteral('5')));

        this.backendGenerator.addStatement(
          factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier(sanitizedName),
                factory.createIdentifier('addGlobalSecondaryIndex'),
              ),
              undefined,
              [factory.createObjectLiteralExpression(gsiProps)],
            ),
          ),
        );
      }
    }
  }

  private extractStorageTriggers(
    notifications: Awaited<ReturnType<typeof this.gen1App.aws.fetchBucketNotifications>>,
  ): Partial<Record<StorageTriggerEvent, Lambda>> {
    const triggers: Partial<Record<StorageTriggerEvent, Lambda>> = {};
    const lambdaConfigs = notifications.LambdaFunctionConfigurations || [];

    for (const config of lambdaConfigs) {
      const functionName = config.LambdaFunctionArn ? config.LambdaFunctionArn.split(':').pop()?.split('-')[0] : '';
      const event = config.Events ? config.Events[0] : '';

      if (event.includes('ObjectCreated') && functionName) {
        triggers.onUpload = { source: path.join('amplify', 'backend', 'function', functionName, 'src') };
      } else if (event.includes('ObjectRemoved') && functionName) {
        triggers.onDelete = { source: path.join('amplify', 'backend', 'function', functionName, 'src') };
      }
    }

    return triggers;
  }

  private buildAccessPatterns(cliInputs: StorageCLIInputsJSON, functionNames: string[]): AccessPatterns {
    let groups: AccessPatterns['groups'] | undefined;
    if (cliInputs.groupAccess && Object.keys(cliInputs.groupAccess).length > 0) {
      groups = Object.entries(cliInputs.groupAccess).reduce((acc, [key, value]) => {
        acc[key] = value.flatMap((p) => PERMISSION_MAP[p]);
        return acc;
      }, {} as Record<string, Permission[]>);
    }

    const accessPatterns: AccessPatterns = {
      guest: cliInputs.guestAccess.flatMap((p) => PERMISSION_MAP[p]),
      auth: cliInputs.authAccess.flatMap((p) => PERMISSION_MAP[p]),
      groups,
    };

    // Note: Function S3 access pattern detection requires reading CloudFormation
    // templates from the local project. This is handled by the old code's
    // S3CloudFormationAccessParser. For this phase, function access patterns
    // from CFN templates are not extracted — they will be added in Phase 4.

    return accessPatterns;
  }

  private async fetchDynamoDBTable(storageName: string, storageMeta: Record<string, unknown>): Promise<DynamoDBTableDefinition> {
    const output = storageMeta.output as Record<string, string> | undefined;
    const actualTableName = output?.Name || storageName;

    const describeResult = await this.gen1App.clients.dynamoDB.send(new DescribeTableCommand({ TableName: actualTableName }));
    const table = describeResult.Table!;

    const partitionKey: DynamoDBAttribute = {
      name: table.KeySchema!.find((k) => k.KeyType === 'HASH')!.AttributeName!,
      type: mapAttributeType(
        table.AttributeDefinitions!.find((a) => a.AttributeName === table.KeySchema!.find((k) => k.KeyType === 'HASH')!.AttributeName)!
          .AttributeType!,
      ),
    };

    let sortKey: DynamoDBAttribute | undefined;
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
        const gsiDef: DynamoDBGSI = {
          indexName: gsi.IndexName!,
          partitionKey: {
            name: gsi.KeySchema!.find((k) => k.KeyType === 'HASH')!.AttributeName!,
            type: mapAttributeType(
              table.AttributeDefinitions!.find((a) => a.AttributeName === gsi.KeySchema!.find((k) => k.KeyType === 'HASH')!.AttributeName)!
                .AttributeType!,
            ),
          },
          ...(gsi.KeySchema!.find((k) => k.KeyType === 'RANGE') && {
            sortKey: {
              name: gsi.KeySchema!.find((k) => k.KeyType === 'RANGE')!.AttributeName!,
              type: mapAttributeType(
                table.AttributeDefinitions!.find(
                  (a) => a.AttributeName === gsi.KeySchema!.find((k) => k.KeyType === 'RANGE')!.AttributeName,
                )!.AttributeType!,
              ),
            },
          }),
        };
        gsis.push(gsiDef);
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

function sanitizeVariableName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_$]/g, '_');
}
