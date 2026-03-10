import path from 'node:path';
import fs from 'node:fs/promises';
import execa from 'execa';
import { Logger } from '../../gen2-migration';
import { createAwsClients } from './input/aws-clients';
import { Gen1App } from './input/gen1-app';
import { Generator } from './generator';
import { AmplifyMigrationOperation } from '../_operation';
import { BackendGenerator } from './output/backend.generator';
import { RootPackageJsonGenerator } from './output/root-package-json.generator';
import { BackendPackageJsonGenerator } from './output/backend-package-json.generator';
import { TsConfigGenerator } from './output/tsconfig.generator';
import { AmplifyYmlGenerator } from './output/amplify-yml.generator';
import { GitIgnoreGenerator } from './output/gitignore.generator';
import { AuthGenerator } from './output/auth/auth.generator';
import { DataGenerator } from './output/data/data.generator';
import { RestApiGenerator } from './output/rest-api/rest-api.generator';
import { StorageGenerator } from './output/storage/storage.generator';
import { FunctionGenerator } from './output/functions/function.generator';
import { AnalyticsGenerator } from './output/analytics/analytics.generator';
import { CustomResourcesGenerator } from './output/custom-resources/custom.generator';
import { fileOrDirectoryExists } from './input/file-exists';

const TEMP_GEN_2_OUTPUT_DIR = 'amplify-gen2';
const AMPLIFY_DIR = 'amplify';

/**
 * Assembles all category generators based on the Gen1 app's
 * amplify-meta.json and returns the full list of migration operations.
 *
 * Operations are returned — not executed — so the parent dispatcher
 * can display descriptions to the user before confirmation.
 */
export async function prepareNew(logger: Logger, appId: string, envName: string, region: string): Promise<AmplifyMigrationOperation[]> {
  const clients = createAwsClients(region);
  const gen1App = new Gen1App({ appId, region, envName, clients });
  const meta = await gen1App.fetchMeta();

  const outputDir = TEMP_GEN_2_OUTPUT_DIR;
  const backendGenerator = new BackendGenerator(outputDir);
  const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);

  const generators: Generator[] = [];

  let authProviderSetup: Generator | undefined;
  if (meta.auth) {
    const authGenerator = new AuthGenerator(gen1App, backendGenerator, outputDir);
    generators.push(authGenerator);
    authProviderSetup = await authGenerator.planProviderSetup();
  }

  if (meta.storage) {
    generators.push(new StorageGenerator(gen1App, backendGenerator, outputDir));
  }

  // Provider setup must appear after storage overrides in backend.ts.
  if (authProviderSetup) {
    generators.push(authProviderSetup);
  }

  if (meta.api) {
    generators.push(new DataGenerator(gen1App, backendGenerator, outputDir));
    generators.push(new RestApiGenerator(gen1App, backendGenerator));
  }

  if (meta.analytics) {
    generators.push(new AnalyticsGenerator(gen1App, backendGenerator, outputDir));
  }

  if (meta.custom) {
    generators.push(new CustomResourcesGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir));
  }

  if (meta.function) {
    const functionNames = await gen1App.fetchFunctionNames();
    for (const resourceName of functionNames) {
      generators.push(new FunctionGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir, resourceName));
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

  // Collect all operations from generators in order.
  const operations: AmplifyMigrationOperation[] = [];
  for (const generator of generators) {
    operations.push(...(await generator.plan()));
  }

  // Post-generation: replace local amplify folder and reinstall deps.
  operations.push({
    describe: async () => ["Replace local 'amplify' folder with generated Gen2 output", 'Install Gen2 dependencies'],
    execute: async () => {
      const cwd = process.cwd();
      logger.info(`Overriding local 'amplify' folder`);
      await fs.rm(AMPLIFY_DIR, { recursive: true });
      await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/amplify`, `${cwd}/amplify`);
      await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/package.json`, `${cwd}/package.json`);
      await fs.rm(TEMP_GEN_2_OUTPUT_DIR, { recursive: true });

      const packageLockPath = path.join(cwd, 'package-lock.json');
      const nodeModulesPath = path.join(cwd, 'node_modules');

      if (await fileOrDirectoryExists(packageLockPath)) {
        logger.info('Deleting package-lock.json');
        await fs.rm(packageLockPath, { recursive: true });
      }

      if (await fileOrDirectoryExists(nodeModulesPath)) {
        logger.info('Deleting node_modules');
        await fs.rm(nodeModulesPath, { recursive: true });
      }

      logger.info('Installing dependencies');
      await DependenciesInstaller.install();
    },
  });

  return operations;
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
