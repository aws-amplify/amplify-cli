import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { S3Renderer, AccessPatterns, Permission, FunctionAccess, StorageTriggers } from './s3.renderer';
import { SpinningLogger } from '../../../_common/spinning-logger';

/**
 * CLI v1 permission types from cli-inputs.json.
 */
type CLIV1Permission = 'READ' | 'CREATE_AND_UPDATE' | 'DELETE';

const PERMISSION_MAP: Readonly<Record<CLIV1Permission, readonly Permission[]>> = {
  READ: ['read'],
  DELETE: ['delete'],
  CREATE_AND_UPDATE: ['write'],
};

/**
 * Generates S3 storage resource and contributes to backend.ts.
 *
 * Reads bucket config (acceleration, versioning, encryption) via
 * Gen1App.aws, reads cli-inputs.json for access patterns, and
 * generates amplify/storage/resource.ts with defineStorage().
 *
 * S3 triggers are contributed by FunctionGenerator via addTrigger().
 */
export class S3Generator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly renderer: S3Renderer;
  private readonly functionAccess: FunctionAccess[] = [];
  private readonly triggers: StorageTriggers = {};
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
    this.renderer = new S3Renderer();
    this.logger = logger;
  }

  /**
   * Registers a function's S3 storage access permissions.
   * Called by FunctionGenerator before S3Generator.execute() runs.
   */
  public addFunctionAccess(functionName: string, permissions: readonly Permission[]): void {
    this.functionAccess.push({ functionName, permissions });
  }

  /**
   * Registers an S3 trigger contributed by a function generator.
   */
  public addTrigger(event: 'onUpload' | 'onDelete', functionName: string): void {
    (this.triggers as Record<string, string>)[event] = functionName;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const bucketName = this.gen1App.resourceMetaOutput(this.resource, 'BucketName');

    this.logger.debug(`Fetching S3 bucket config '${bucketName}'`);
    const [accelerateStatus, versioningStatus, encryption] = await Promise.all([
      this.gen1App.aws.fetchBucketAccelerate(bucketName),
      this.gen1App.aws.fetchBucketVersioning(bucketName),
      this.gen1App.aws.fetchBucketEncryption(bucketName),
    ]);

    const storageDir = path.join(this.outputDir, 'amplify', 'storage');

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => ['Generate amplify/storage/resource.ts'],
        execute: async () => {
          this.logger.info('Rendering storage/resource.ts');
          const nodes = this.renderer.render({
            name: bucketName,
            access: this.buildAccessPatterns(),
            triggers: this.triggers,
            bucketName,
            accelerateStatus,
            versioningStatus,
            encryption,
          });

          const content = TS.printNodes(nodes);
          await fs.mkdir(storageDir, { recursive: true });
          await fs.writeFile(path.join(storageDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('storage', './storage/resource');
          this.backendGenerator.addDefineBackendEntry('storage', 'storage', 'storage');
          this.backendGenerator.addApplyEscapeHatchesCall({ alias: 'storage', extraArgs: [] });
          this.backendGenerator.addPostRefactorCall('storage.postRefactor(backend);');
        },
      },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped JSON from cli-inputs.json
  private buildAccessPatterns(): AccessPatterns {
    const cliInputs = this.gen1App.cliInputs('storage', this.resource.resourceName) as any;
    let groups: AccessPatterns['groups'] | undefined;
    if (cliInputs.groupAccess && Object.keys(cliInputs.groupAccess).length > 0) {
      groups = Object.entries(cliInputs.groupAccess).reduce((acc, [key, value]) => {
        acc[key] = (value as CLIV1Permission[]).flatMap((p) => PERMISSION_MAP[p]);
        return acc;
      }, {} as Record<string, Permission[]>);
    }

    return {
      guest: cliInputs.guestAccess.flatMap((p) => PERMISSION_MAP[p]),
      auth: cliInputs.authAccess.flatMap((p) => PERMISSION_MAP[p]),
      groups,
      functions: this.functionAccess.length > 0 ? this.functionAccess : undefined,
    };
  }
}
