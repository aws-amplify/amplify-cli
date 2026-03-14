import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import execa from 'execa';
import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { AmplifyGen2MigrationValidations } from './_validations';
import { AwsClients } from './aws-clients';
import { Gen1App } from './generate-new/_infra/gen1-app';
import { Assessment } from './_assessment';
import { Planner } from './planner';
import { BackendGenerator } from './generate-new/amplify/backend.generator';
import { RootPackageJsonGenerator } from './generate-new/package.json.generator';
import { BackendPackageJsonGenerator } from './generate-new/amplify/package.json.generator';
import { TsConfigGenerator } from './generate-new/amplify/tsconfig.generator';
import { AmplifyYmlGenerator } from './generate-new/amplify.yml.generator';
import { GitIgnoreGenerator } from './generate-new/gitignore.generator';
import { AuthGenerator } from './generate-new/amplify/auth/auth.generator';
import { ReferenceAuthGenerator } from './generate-new/amplify/auth/reference-auth.generator';
import { DataGenerator } from './generate-new/amplify/data/data.generator';
import { RestApiGenerator } from './generate-new/amplify/rest-api/rest-api.generator';
import { S3Generator } from './generate-new/amplify/storage/s3.generator';
import { DynamoDBGenerator } from './generate-new/amplify/storage/dynamodb.generator';
import { FunctionGenerator } from './generate-new/amplify/function/function.generator';
import { AnalyticsKinesisGenerator } from './generate-new/amplify/analytics/kinesis.generator';
import { CustomResourceGenerator } from './generate-new/amplify/custom-resources/custom.generator';
import { fileOrDirectoryExists } from './generate-new/_infra/files';

const AMPLIFY_DIR = 'amplify';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  private readonly assessment?: Assessment;

  constructor(...args: [...ConstructorParameters<typeof AmplifyMigrationStep>, Assessment?]) {
    const assessment = args.length > 7 ? args[7] : undefined;
    super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    this.assessment = assessment;
  }

  public async executeImplications(): Promise<string[]> {
    return ['TODO'];
  }

  public async rollbackImplications(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  public async executeValidate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    await validations.validateLockStatus();
    await validations.validateWorkingDirectory();
  }

  public async rollbackValidate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * Assembles all category generators based on the Gen1 app's
   * amplify-meta.json and returns the full list of migration operations.
   *
   * Uses discover() to iterate all resources, then dispatches by
   * (category, service) using the same GENERATE_SUPPORTED map that
   * assess() uses. Unsupported resources are skipped.
   *
   * Operations are returned — not executed — so the parent dispatcher
   * can display descriptions to the user before confirmation.
   */
  public async execute(): Promise<AmplifyMigrationOperation[]> {
    const clients = new AwsClients({ region: this.region });
    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });

    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amplify-gen2-'));
    const backendGenerator = new BackendGenerator(outputDir);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);

    const generators: Planner[] = [];
    const discovered = gen1App.discover();

    // Cross-category state captured during the loop and consumed by
    // function generators below.
    let authGenerator: AuthGenerator | undefined;
    let s3Generator: S3Generator | undefined;

    for (const resource of discovered) {
      const supported = (() => {
        switch (`${resource.category}:${resource.service}`) {
          case 'auth:Cognito':
          case 'storage:S3':
          case 'storage:DynamoDB':
          case 'api:AppSync':
          case 'api:API Gateway':
          case 'analytics:Kinesis':
          case 'custom:CloudFormation':
          case 'function:Lambda':
            return true;
          default:
            return false;
        }
      })();

      this.assessment?.record('generate', resource, { supported, notes: [] });
      if (!supported) continue;

      switch (`${resource.category}:${resource.service}`) {
        case 'auth:Cognito': {
          // Reference auth detection: check if any auth resource is imported.
          const isReferenceAuth = discovered
            .filter((r) => r.category === 'auth')
            .some((r) => {
              const meta = (gen1App.meta('auth') ?? {})[r.resourceName] as Record<string, unknown> | undefined;
              return meta?.serviceType === 'imported';
            });

          if (isReferenceAuth) {
            generators.push(new ReferenceAuthGenerator(gen1App, backendGenerator, outputDir));
          } else {
            authGenerator = new AuthGenerator(gen1App, backendGenerator, outputDir);
            generators.push(authGenerator);
          }
          break;
        }
        case 'storage:S3':
          s3Generator = new S3Generator(gen1App, backendGenerator, outputDir);
          generators.push(s3Generator);
          break;
        case 'storage:DynamoDB': {
          const hasS3Bucket = discovered.some((r) => r.category === 'storage' && r.service === 'S3');
          generators.push(new DynamoDBGenerator(gen1App, backendGenerator, resource.resourceName, hasS3Bucket));
          break;
        }
        case 'api:AppSync':
          generators.push(new DataGenerator(gen1App, backendGenerator, outputDir));
          break;
        case 'api:API Gateway':
          generators.push(new RestApiGenerator(gen1App, backendGenerator, resource.resourceName));
          break;
        case 'analytics:Kinesis':
          generators.push(new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, resource.resourceName));
          break;
        case 'custom:CloudFormation':
          generators.push(new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, resource.resourceName));
          break;
        case 'function:Lambda': {
          const functionCategoryMap = computeFunctionCategories(gen1App);
          generators.push(
            new FunctionGenerator({
              gen1App,
              backendGenerator,
              authGenerator,
              s3Generator,
              packageJsonGenerator,
              outputDir,
              resourceName: resource.resourceName,
              category: functionCategoryMap.get(resource.resourceName) ?? 'function',
            }),
          );
          break;
        }
      }
    }

    // Infrastructure generators run last — BackendGenerator accumulates
    // contributions from all category generators above.
    generators.push(backendGenerator);
    generators.push(packageJsonGenerator);
    generators.push(new BackendPackageJsonGenerator(outputDir));
    generators.push(new TsConfigGenerator(outputDir));
    generators.push(new AmplifyYmlGenerator(gen1App));
    generators.push(new GitIgnoreGenerator());

    // No-op operation shown first so the user sees "Delete amplify/" at the top.
    // The actual deletion happens in the post-generation operation below.
    const operations: AmplifyMigrationOperation[] = [
      {
        validate: async () => {
          return;
        },
        describe: async () => ['Delete amplify/'],
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      },
    ];

    // Collect all operations from generators in order.
    for (const generator of generators) {
      operations.push(...(await generator.plan()));
    }

    // Post-generation: replace local amplify folder.
    operations.push({
      validate: async () => {
        return;
      },
      describe: async () => [],
      execute: async () => {
        const cwd = process.cwd();
        this.logger.info('Deleting amplify/');
        await fs.rm(AMPLIFY_DIR, { recursive: true });
        await fs.rename(path.join(outputDir, 'amplify'), path.join(cwd, 'amplify'));
        await fs.rename(path.join(outputDir, 'package.json'), path.join(cwd, 'package.json'));
        await fs.rm(outputDir, { recursive: true });
      },
    });

    // Post-generation: reinstall dependencies.
    operations.push({
      validate: async () => {
        return;
      },
      describe: async () => ['Install Gen2 dependencies'],
      execute: async () => {
        const cwd = process.cwd();
        const packageLockPath = path.join(cwd, 'package-lock.json');
        const nodeModulesPath = path.join(cwd, 'node_modules');

        if (await fileOrDirectoryExists(packageLockPath)) {
          this.logger.info('Deleting package-lock.json');
          await fs.rm(packageLockPath, { recursive: true });
        }

        if (await fileOrDirectoryExists(nodeModulesPath)) {
          this.logger.info('Deleting node_modules');
          await fs.rm(nodeModulesPath, { recursive: true });
        }

        this.logger.info('Installing dependencies');
        await DependenciesInstaller.install();
      },
    });

    return operations;
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Not Implemented');
  }
}

/**
 * Handles npm dependency installation with retry.
 */
export class DependenciesInstaller {
  /**
   * Runs npm install twice to resolve transient dependency conflicts.
   */
  public static async install(): Promise<void> {
    await execa('npm', ['install']);
    await execa('npm', ['install']);
  }
}

/**
 * Derives a function-to-category map from dependsOn relationships
 * in amplify-meta.json. A function's category is determined by which
 * other category depends on it (auth → 'auth', storage → 'storage')
 * or which category it depends on (function → storage = 'storage').
 * Functions with no cross-category dependencies default to 'function'.
 */
function computeFunctionCategories(gen1App: Gen1App): ReadonlyMap<string, string> {
  const categoryMap = new Map<string, string>();
  const auth = gen1App.meta('auth') as Record<string, Record<string, unknown>> | undefined;
  const storage = gen1App.meta('storage') as Record<string, Record<string, unknown>> | undefined;
  const functions = gen1App.meta('function') as Record<string, Record<string, unknown>> | undefined;

  if (auth) {
    for (const authResource of Object.values(auth)) {
      if (authResource.dependsOn) {
        for (const dep of authResource.dependsOn as Array<{ category: string; resourceName: string }>) {
          if (dep.category === 'function') {
            categoryMap.set(dep.resourceName, 'auth');
          }
        }
      }
    }
  }

  if (storage) {
    for (const storageResource of Object.values(storage)) {
      if (storageResource.dependsOn) {
        for (const dep of storageResource.dependsOn as Array<{ category: string; resourceName: string }>) {
          if (dep.category === 'function') {
            categoryMap.set(dep.resourceName, 'storage');
          }
        }
      }
    }
  }

  if (functions) {
    for (const [funcName, funcResource] of Object.entries(functions)) {
      if (funcResource.dependsOn) {
        for (const dep of funcResource.dependsOn as Array<{ category: string; resourceName: string }>) {
          if (dep.category === 'storage') {
            categoryMap.set(funcName, 'storage');
          }
        }
      }
    }
  }

  return categoryMap;
}
