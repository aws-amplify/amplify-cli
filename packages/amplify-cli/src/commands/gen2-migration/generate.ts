import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import execa from 'execa';
import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation, ValidationResult } from './_operation';
import { Plan } from './_plan';
import { AmplifyGen2MigrationValidations } from './_validations';
import { AwsClients } from './aws-clients';
import { Gen1App } from './generate/_infra/gen1-app';
import { Assessment } from './_assessment';
import { Planner } from './planner';
import { BackendGenerator } from './generate/amplify/backend.generator';
import { RootPackageJsonGenerator } from './generate/package.json.generator';
import { BackendPackageJsonGenerator } from './generate/amplify/package.json.generator';
import { TsConfigGenerator } from './generate/amplify/tsconfig.generator';
import { AmplifyYmlGenerator } from './generate/amplify.yml.generator';
import { GitIgnoreGenerator } from './generate/gitignore.generator';
import { AuthGenerator } from './generate/amplify/auth/auth.generator';
import { ReferenceAuthGenerator } from './generate/amplify/auth/reference-auth.generator';
import { DataGenerator } from './generate/amplify/data/data.generator';
import { RestApiGenerator } from './generate/amplify/rest-api/rest-api.generator';
import { S3Generator } from './generate/amplify/storage/s3.generator';
import { DynamoDBGenerator } from './generate/amplify/storage/dynamodb.generator';
import { FunctionGenerator } from './generate/amplify/function/function.generator';
import { AnalyticsKinesisGenerator } from './generate/amplify/analytics/kinesis.generator';
import { fileOrDirectoryExists } from './generate/_infra/files';

const AMPLIFY_DIR = 'amplify';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  /**
   * Records generate support for each discovered resource into the assessment.
   */
  public async assess(assessment: Assessment): Promise<void> {
    const clients = new AwsClients({ region: this.region });
    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });
    const discovered = gen1App.discover();

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito':
        case 'auth:Cognito-UserPool-Groups':
        case 'storage:S3':
        case 'storage:DynamoDB':
        case 'api:AppSync':
        case 'api:API Gateway':
        case 'analytics:Kinesis':
        case 'function:Lambda':
          assessment.record('generate', resource, { supported: true });
          break;
        case 'unsupported':
          assessment.record('generate', resource, { supported: false });
          break;
      }
    }
  }

  public async forward(): Promise<Plan> {
    const clients = new AwsClients({ region: this.region });
    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });

    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amplify-gen2-'));
    const backendGenerator = new BackendGenerator(outputDir);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);

    const generators: Planner[] = [];
    const discovered = gen1App.discover();

    // Cross-category state captured during the loop.
    let authGenerator: AuthGenerator | undefined;
    let s3Generator: S3Generator | undefined;
    const functionGenerators: FunctionGenerator[] = [];

    for (const resource of discovered) {
      switch (resource.key) {
        case 'auth:Cognito': {
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
        case 'auth:Cognito-UserPool-Groups':
          // Handled by the AuthGenerator created for the main Cognito resource.
          break;
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
        case 'function:Lambda': {
          const functionCategoryMap = computeFunctionCategories(gen1App);
          const funcGen = new FunctionGenerator({
            gen1App,
            backendGenerator,
            packageJsonGenerator,
            outputDir,
            resourceName: resource.resourceName,
            category: functionCategoryMap.get(resource.resourceName) ?? 'function',
          });
          generators.push(funcGen);
          functionGenerators.push(funcGen);
          break;
        }
        case 'unsupported':
          this.logger.warn(
            `Skipping unsupported resource '${resource.resourceName}' (${resource.category}:${resource.service}). You will need to write Gen2 code for this resource manually.`,
          );
          break;
      }
    }

    // Wire cross-category dependencies after all generators are created.
    for (const funcGen of functionGenerators) {
      if (authGenerator) funcGen.setAuthGenerator(authGenerator);
      if (s3Generator) funcGen.setS3Generator(s3Generator);
    }

    // Infrastructure generators run last — BackendGenerator accumulates
    // contributions from all category generators above.
    generators.push(backendGenerator);
    generators.push(packageJsonGenerator);
    generators.push(new BackendPackageJsonGenerator(outputDir));
    generators.push(new TsConfigGenerator(outputDir));
    generators.push(new AmplifyYmlGenerator(gen1App));
    generators.push(new GitIgnoreGenerator());

    const operations: AmplifyMigrationOperation[] = [
      // Validation-only operations (formerly in executeValidate)
      {
        describe: async () => [],
        validate: () => ({ description: 'Lock status', run: () => this.validateLockStatus() }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      },
      {
        describe: async () => [],
        validate: () => ({ description: 'Working directory', run: () => this.validateWorkingDirectory() }),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        execute: async () => {},
      },
      {
        validate: () => undefined,
        describe: async () => [`Delete directory: ${path.join(process.cwd(), 'amplify')}`],
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
      validate: () => undefined,
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
      validate: () => undefined,
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

    return new Plan({
      operations,
      logger: this.logger,
      title: 'Execute',
      implications: ["Your local 'amplify/' directory will be replaced with Gen2 code", 'Dependencies will be reinstalled'],
    });
  }

  public async rollback(): Promise<Plan> {
    throw new Error('Not Implemented');
  }

  private async validateLockStatus(): Promise<ValidationResult> {
    try {
      const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
      await validations.validateLockStatus();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
  }

  private async validateWorkingDirectory(): Promise<ValidationResult> {
    try {
      const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
      await validations.validateWorkingDirectory();
      return { valid: true };
    } catch (e) {
      return { valid: false, report: e.message };
    }
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
