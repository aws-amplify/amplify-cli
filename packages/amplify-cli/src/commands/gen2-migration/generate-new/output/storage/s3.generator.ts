import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import type { BucketAccelerateStatus, BucketVersioningStatus, ServerSideEncryptionConfiguration } from '@aws-sdk/client-s3';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { printNodes } from '../../ts-writer';
import { S3Renderer, AccessPatterns, Lambda, StorageTriggerEvent, Permission } from './s3.renderer';

const factory = ts.factory;

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
  readonly guestAccess: readonly CLIV1Permission[];
  readonly authAccess: readonly CLIV1Permission[];
  readonly triggerFunction?: string;
  readonly groupAccess?: Readonly<Record<string, readonly CLIV1Permission[]>>;
}

const PERMISSION_MAP: Readonly<Record<CLIV1Permission, readonly Permission[]>> = {
  READ: ['read'],
  DELETE: ['delete'],
  CREATE_AND_UPDATE: ['write'],
};

/**
 * Generates S3 storage resource and contributes to backend.ts.
 *
 * Reads bucket config (notifications, acceleration, versioning,
 * encryption) via Gen1App.aws, reads cli-inputs.json for access
 * patterns, and generates amplify/storage/resource.ts with
 * defineStorage(). Also contributes S3 bucket overrides to backend.ts.
 */
export class S3Generator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly defineStorage: S3Renderer;
  private readonly functionStorageAccess: Array<{
    readonly functionName: string;
    readonly category: string;
    readonly permissions: readonly Permission[];
  }> = [];

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.defineStorage = new S3Renderer(gen1App.envName);
  }

  /**
   * Registers a function's S3 storage access permissions.
   * Called by FunctionGenerator before S3Generator.execute() runs.
   */
  public addFunctionStorageAccess(functionName: string, category: string, permissions: readonly Permission[]): void {
    this.functionStorageAccess.push({ functionName, category, permissions });
  }

  /**
   * Plans the S3 storage generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const storageCategory = this.gen1App.meta('storage');
    if (!storageCategory) return [];

    const s3Entry = Object.entries(storageCategory).find(([, value]) => (value as Record<string, unknown>).service === 'S3');
    if (!s3Entry) return [];

    const [storageName, storageValue] = s3Entry;
    const storageMeta = storageValue as Record<string, unknown>;

    return [await this.planS3(storageName, storageMeta)];
  }

  private async planS3(storageName: string, storageMeta: Record<string, unknown>): Promise<AmplifyMigrationOperation> {
    const output = storageMeta.output as Record<string, string> | undefined;
    const bucketName = output?.BucketName;
    if (!bucketName) {
      throw new Error(`Could not find bucket name for storage resource '${storageName}'`);
    }

    const cliInputs = this.gen1App.cliInputs('storage', storageName) as StorageCLIInputsJSON;

    const [notifications, accelerateStatus, versioningStatus, encryption] = await Promise.all([
      this.gen1App.aws.fetchBucketNotifications(bucketName),
      this.gen1App.aws.fetchBucketAccelerate(bucketName),
      this.gen1App.aws.fetchBucketVersioning(bucketName),
      this.gen1App.aws.fetchBucketEncryption(bucketName),
    ]);

    const triggers = this.extractTriggers(notifications);
    const storageDir = path.join(this.outputDir, 'amplify', 'storage');
    const storageIdentifier = bucketName;

    return {
      describe: async () => ['Generate amplify/storage/resource.ts'],
      execute: async () => {
        const accessPatterns = this.buildAccessPatterns(cliInputs);
        // Trigger functions are storage triggers by definition — they're
        // invoked by S3 bucket notifications and live under amplify/storage/.
        const triggerFunctionNames = Object.values(triggers).map((t) => t.source.split('/')[3]);
        const triggerFunctionCategories = new Map(triggerFunctionNames.map((name) => [name, 'storage']));
        const nodes = await this.defineStorage.render({
          storageIdentifier,
          accessPatterns,
          triggers,
          triggerFunctionCategories,
        });

        const content = printNodes(nodes);
        await fs.mkdir(storageDir, { recursive: true });
        await fs.writeFile(path.join(storageDir, 'resource.ts'), content, 'utf-8');

        this.backendGenerator.addImport('./storage/resource', ['storage']);
        this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier('storage')));

        this.contributeOverrides(bucketName, accelerateStatus, versioningStatus, encryption);
      },
    };
  }

  private contributeOverrides(
    bucketName: string,
    accelerateStatus: BucketAccelerateStatus | undefined,
    versioningStatus: BucketVersioningStatus | undefined,
    encryption: ServerSideEncryptionConfiguration | undefined,
  ): void {
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

  private extractTriggers(
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

  private buildAccessPatterns(cliInputs: StorageCLIInputsJSON): AccessPatterns {
    let groups: AccessPatterns['groups'] | undefined;
    if (cliInputs.groupAccess && Object.keys(cliInputs.groupAccess).length > 0) {
      groups = Object.entries(cliInputs.groupAccess).reduce((acc, [key, value]) => {
        acc[key] = value.flatMap((p) => PERMISSION_MAP[p]);
        return acc;
      }, {} as Record<string, Permission[]>);
    }

    return {
      guest: cliInputs.guestAccess.flatMap((p) => PERMISSION_MAP[p]),
      auth: cliInputs.authAccess.flatMap((p) => PERMISSION_MAP[p]),
      groups,
      functions: this.functionStorageAccess.length > 0 ? this.functionStorageAccess : undefined,
    };
  }
}
