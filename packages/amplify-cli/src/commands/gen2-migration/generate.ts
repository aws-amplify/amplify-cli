import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import execa from 'execa';
import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { AmplifyGen2MigrationValidations } from './_validations';
import { createAwsClients } from './generate-new/input/aws-clients';
import { Gen1App } from './generate-new/input/gen1-app';
import { Generator } from './generate-new/generator';
import { BackendGenerator } from './generate-new/output/backend.generator';
import { RootPackageJsonGenerator } from './generate-new/output/root-package-json.generator';
import { BackendPackageJsonGenerator } from './generate-new/output/backend-package-json.generator';
import { TsConfigGenerator } from './generate-new/output/tsconfig.generator';
import { AmplifyYmlGenerator } from './generate-new/output/amplify-yml.generator';
import { GitIgnoreGenerator } from './generate-new/output/gitignore.generator';
import { AuthGenerator } from './generate-new/output/auth/auth.generator';
import { DataGenerator } from './generate-new/output/data/data.generator';
import { RestApiGenerator } from './generate-new/output/rest-api/rest-api.generator';
import { S3Generator } from './generate-new/output/storage/s3.generator';
import { DynamoDBGenerator } from './generate-new/output/storage/dynamodb.generator';
import { FunctionGenerator } from './generate-new/output/functions/function.generator';
import { AnalyticsKinesisGenerator } from './generate-new/output/analytics/kinesis.generator';
import { CustomResourceGenerator } from './generate-new/output/custom-resources/custom.generator';
import { fileOrDirectoryExists } from './generate-new/input/file-exists';

const AMPLIFY_DIR = 'amplify';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
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
    const clients = createAwsClients(this.region);
    const gen1App = new Gen1App({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });
    const meta = await gen1App.fetchMeta();

    const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amplify-gen2-'));
    const backendGenerator = new BackendGenerator(outputDir);
    const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);

    const generators: Generator[] = [];

    if (meta.auth) {
      generators.push(new AuthGenerator(gen1App, backendGenerator, outputDir));
    }

    const storageCategory = (meta.storage ?? {}) as Record<string, Record<string, unknown>>;
    for (const [resourceName, resourceMeta] of Object.entries(storageCategory)) {
      if (resourceMeta.service === 'S3') {
        generators.push(new S3Generator(gen1App, backendGenerator, outputDir));
      } else if (resourceMeta.service === 'DynamoDB') {
        generators.push(new DynamoDBGenerator(gen1App, backendGenerator, resourceName));
      }
    }

    const apiCategory = (meta.api ?? {}) as Record<string, Record<string, unknown>>;
    for (const [resourceName, resourceMeta] of Object.entries(apiCategory)) {
      if (resourceMeta.service === 'AppSync') {
        generators.push(new DataGenerator(gen1App, backendGenerator, outputDir));
      } else if (resourceMeta.service === 'API Gateway') {
        generators.push(new RestApiGenerator(gen1App, backendGenerator, resourceName));
      }
    }

    const analyticsCategory = (meta.analytics ?? {}) as Record<string, Record<string, unknown>>;
    for (const [resourceName, resourceMeta] of Object.entries(analyticsCategory)) {
      if (resourceMeta.service === 'Kinesis') {
        generators.push(new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, resourceName));
      }
    }

    const customCategory = (meta.custom ?? {}) as Record<string, Record<string, unknown>>;
    for (const resourceName of Object.keys(customCategory)) {
      generators.push(new CustomResourceGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, resourceName));
    }

    const functionNames = await gen1App.fetchFunctionNames();
    for (const resourceName of functionNames) {
      generators.push(new FunctionGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, resourceName));
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
