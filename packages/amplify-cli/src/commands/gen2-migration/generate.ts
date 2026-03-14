import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import execa from 'execa';
import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { AmplifyGen2MigrationValidations } from './_validations';
import { AwsClients } from './aws-clients';
import { Gen1App, DiscoveredResource, SupportResponse } from './generate-new/_infra/gen1-app';
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

/**
 * Services supported by the generate step, keyed by category.
 */
const GENERATE_SUPPORTED: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['auth', new Set(['Cognito'])],
  ['storage', new Set(['S3', 'DynamoDB'])],
  ['api', new Set(['AppSync', 'API Gateway'])],
  ['analytics', new Set(['Kinesis'])],
  ['custom', new Set(['CloudFormation'])],
  ['function', new Set(['Lambda'])],
]);

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  /**
   * Evaluates whether code generation is supported for a discovered resource.
   * Returns notes for sub-features that are not yet handled.
   */
  public static assess(gen1App: Gen1App, resource: DiscoveredResource): SupportResponse {
    const services = GENERATE_SUPPORTED.get(resource.category);
    if (!services?.has(resource.service)) {
      return { supported: false, notes: [] };
    }

    const notes: string[] = [];

    // Sub-feature detection for functions
    if (resource.category === 'function') {
      try {
        const templatePath = `function/${resource.resourceName}/${resource.resourceName}-cloudformation-template.json`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped CloudFormation template
        const template = gen1App.json(templatePath) as Record<string, any>;
        const customPoliciesResource = template.Resources?.CustomLambdaExecutionPolicy;
        if (customPoliciesResource && customPoliciesResource.Type === 'AWS::IAM::Policy') {
          notes.push('custom-policies not supported');
        }
      } catch {
        // Template may not exist for all functions (e.g. not yet deployed).
        // Sub-feature detection is best-effort — missing template is harmless.
      }
    }

    return { supported: true, notes };
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

    const authCategory = gen1App.meta('auth');
    const isReferenceAuth = authCategory
      ? Object.values(authCategory).some(
          (v) => typeof v === 'object' && v !== null && 'serviceType' in v && (v as Record<string, unknown>).serviceType === 'imported',
        )
      : false;

    let authGenerator: AuthGenerator | undefined;
    if (authCategory && isReferenceAuth) {
      generators.push(new ReferenceAuthGenerator(gen1App, backendGenerator, outputDir));
    } else if (authCategory) {
      authGenerator = new AuthGenerator(gen1App, backendGenerator, outputDir);
      generators.push(authGenerator);
    }

    let s3Generator: S3Generator | undefined;
    const storageCategory = (gen1App.meta('storage') ?? {}) as Record<string, Record<string, unknown>>;
    const hasS3Bucket = Object.values(storageCategory).some((v) => v.service === 'S3');
    for (const [resourceName, resourceMeta] of Object.entries(storageCategory)) {
      if (resourceMeta.service === 'S3') {
        s3Generator = new S3Generator(gen1App, backendGenerator, outputDir);
        generators.push(s3Generator);
      } else if (resourceMeta.service === 'DynamoDB') {
        generators.push(new DynamoDBGenerator(gen1App, backendGenerator, resourceName, hasS3Bucket));
      }
    }

    const apiCategory = (gen1App.meta('api') ?? {}) as Record<string, Record<string, unknown>>;
    for (const [resourceName, resourceMeta] of Object.entries(apiCategory)) {
      if (resourceMeta.service === 'AppSync') {
        generators.push(new DataGenerator(gen1App, backendGenerator, outputDir));
      } else if (resourceMeta.service === 'API Gateway') {
        generators.push(new RestApiGenerator(gen1App, backendGenerator, resourceName));
      }
    }

    const analyticsCategory = (gen1App.meta('analytics') ?? {}) as Record<string, Record<string, unknown>>;
    for (const [resourceName, resourceMeta] of Object.entries(analyticsCategory)) {
      if (resourceMeta.service === 'Kinesis') {
        generators.push(new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, resourceName));
      }
    }

    const customCategory = (gen1App.meta('custom') ?? {}) as Record<string, Record<string, unknown>>;
    for (const resourceName of Object.keys(customCategory)) {
      generators.push(new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, resourceName));
    }

    const functionCategory = (gen1App.meta('function') ?? {}) as Record<string, Record<string, unknown>>;
    const functionCategoryMap = computeFunctionCategories(gen1App);
    for (const resourceName of Object.keys(functionCategory)) {
      const category = functionCategoryMap.get(resourceName) ?? 'function';
      generators.push(
        new FunctionGenerator({
          gen1App,
          backendGenerator,
          authGenerator,
          s3Generator,
          packageJsonGenerator,
          outputDir,
          resourceName,
          category,
        }),
      );
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
