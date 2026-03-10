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
    this.defineStorage = new S3Renderer(gen1App.envName);
    this.functionNamesAndCategories = functionNamesAndCategories;
  }

  /**
   * Plans the S3 storage generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const storageCategory = await this.gen1App.fetchMetaCategory('storage');
    if (!storageCategory) return [];

    const s3Entry = Object.entries(storageCategory).find(([, value]) => (value as Record<string, unknown>).service === 'S3');
    if (!s3Entry) return [];

    const [storageName, storageValue] = s3Entry;
    const storageMeta = storageValue as Record<string, unknown>;
    const meta = await this.gen1App.fetchMeta();
    const functionNames = meta.function ? Object.keys(meta.function as object) : [];

    return [await this.planS3(storageName, storageMeta, functionNames)];
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

    const triggers = this.extractTriggers(notifications);
    const accessPatterns = this.buildAccessPatterns(cliInputs, functionNames);
    const storageDir = path.join(this.outputDir, 'amplify', 'storage');
    const storageIdentifier = bucketName;

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

  private buildAccessPatterns(cliInputs: StorageCLIInputsJSON, functionNames: string[]): AccessPatterns {
    let groups: AccessPatterns['groups'] | undefined;
    if (cliInputs.groupAccess && Object.keys(cliInputs.groupAccess).length > 0) {
      groups = Object.entries(cliInputs.groupAccess).reduce((acc, [key, value]) => {
        acc[key] = value.flatMap((p) => PERMISSION_MAP[p]);
        return acc;
      }, {} as Record<string, Permission[]>);
    }

    const functions = this.extractFunctionS3Access(functionNames);

    return {
      guest: cliInputs.guestAccess.flatMap((p) => PERMISSION_MAP[p]),
      auth: cliInputs.authAccess.flatMap((p) => PERMISSION_MAP[p]),
      groups,
      functions: functions.length > 0 ? functions : undefined,
    };
  }

  /**
   * Reads each function's CloudFormation template and extracts S3
   * permissions, mapping them to Gen2 access patterns.
   */
  private extractFunctionS3Access(functionNames: string[]): Array<{ functionName: string; permissions: Permission[] }> {
    const S3_ACTION_TO_PERMISSION: Record<string, Permission> = {
      's3:GetObject': 'read',
      's3:PutObject': 'write',
      's3:DeleteObject': 'delete',
      's3:ListBucket': 'read',
    };

    const result: Array<{ functionName: string; permissions: Permission[] }> = [];

    for (const functionName of functionNames) {
      const templatePath = path.join('amplify', 'backend', 'function', functionName, `${functionName}-cloudformation-template.json`);
      try {
        const content = require('fs').readFileSync(templatePath, 'utf-8');
        const template = JSON.parse(content);
        const policy = template.Resources?.AmplifyResourcesPolicy;
        if (!policy || policy.Type !== 'AWS::IAM::Policy') continue;

        const statements = policy.Properties?.PolicyDocument?.Statement ?? [];
        const permissions = new Set<Permission>();

        for (const stmt of Array.isArray(statements) ? statements : [statements]) {
          if (stmt.Effect !== 'Allow') continue;
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          for (const action of actions) {
            if (typeof action === 'string' && S3_ACTION_TO_PERMISSION[action]) {
              permissions.add(S3_ACTION_TO_PERMISSION[action]);
            }
          }
        }

        if (permissions.size > 0) {
          result.push({ functionName, permissions: Array.from(permissions) });
        }
      } catch {
        // Template not found or unreadable
      }
    }

    return result;
  }
}
