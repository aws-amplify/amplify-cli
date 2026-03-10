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

const TEMP_GEN_2_OUTPUT_DIR = 'amplify-gen2';
const AMPLIFY_DIR = 'amplify';

/**
 * Orchestrates the full Gen2 code generation pipeline using the new
 * generator infrastructure. Replaces the old `prepare()` function.
 *
 * Creates all category generators based on what exists in the Gen1
 * app's amplify-meta.json, collects their operations, executes them
 * sequentially, then replaces the local amplify folder with the
 * generated output and reinstalls npm dependencies.
 */
export async function prepareNew(logger: Logger, appId: string, envName: string, region: string): Promise<void> {
  const clients = createAwsClients(region);
  const gen1App = new Gen1App({ appId, region, envName, clients });
  const meta = await gen1App.fetchMeta();

  const outputDir = TEMP_GEN_2_OUTPUT_DIR;
  const backendGenerator = new BackendGenerator(outputDir);
  const packageJsonGenerator = new RootPackageJsonGenerator(outputDir);

  // Pre-fetch all stack resources so that mock clients can resolve
  // physical resource IDs (e.g., Lambda function names → stack names).
  await gen1App.fetchAllStackResources();

  const generators: Generator[] = [];

  // Auth operations are split: the first generates auth/resource.ts and
  // contributes auth overrides. Late operations (provider setup) must run
  // after storage so they appear in the correct position in backend.ts.
  let lateAuthOperations: AmplifyMigrationOperation[] = [];
  if (meta.auth) {
    const authGenerator = new AuthGenerator(gen1App, backendGenerator, outputDir);
    const authOps = await authGenerator.plan();
    if (authOps.length > 0) {
      generators.push({ plan: async () => [authOps[0]] });
    }
    lateAuthOperations = authOps.slice(1);
  }

  let storageGenerator: Generator | undefined;
  if (meta.storage) {
    storageGenerator = new StorageGenerator(gen1App, backendGenerator, outputDir);
    generators.push(storageGenerator);
  }

  if (meta.api) {
    const apiCategory = meta.api as Record<string, Record<string, unknown>>;
    const hasAppSync = Object.values(apiCategory).some((v) => v.service === 'AppSync');
    const hasApiGateway = Object.values(apiCategory).some((v) => v.service === 'API Gateway');

    if (hasAppSync) {
      const hasAuth = meta.auth !== undefined;
      generators.push(new DataGenerator(gen1App, backendGenerator, outputDir, hasAuth));
    }
    if (hasApiGateway) {
      const hasAuth = meta.auth !== undefined;
      generators.push(new RestApiGenerator(gen1App, backendGenerator, hasAuth));
    }
  }

  if (meta.analytics) {
    generators.push(new AnalyticsGenerator(gen1App, backendGenerator, outputDir));
  }

  if (meta.custom) {
    generators.push(new CustomResourcesGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir));
  }

  if (meta.function) {
    const functionCategory = meta.function as Record<string, unknown>;
    for (const resourceName of Object.keys(functionCategory)) {
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
  let lateAuthInserted = false;
  for (const generator of generators) {
    // Insert late auth operations (provider setup) before BackendGenerator
    // if they haven't been inserted after storage already.
    if (generator === backendGenerator && !lateAuthInserted && lateAuthOperations.length > 0) {
      operations.push(...lateAuthOperations);
      lateAuthInserted = true;
    }
    operations.push(...(await generator.plan()));
    // Insert late auth operations (provider setup) after storage so they
    // appear in the correct position in backend.ts.
    if (generator === storageGenerator && lateAuthOperations.length > 0) {
      operations.push(...lateAuthOperations);
      lateAuthInserted = true;
    }
  }

  for (const operation of operations) {
    await operation.execute();
  }

  // Post-generation: replace local amplify folder with generated output
  const cwd = process.cwd();
  logger.info(`Overriding local 'amplify' folder`);
  await fs.rm(AMPLIFY_DIR, { recursive: true });
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/amplify`, `${cwd}/amplify`);
  await fs.rename(`${TEMP_GEN_2_OUTPUT_DIR}/package.json`, `${cwd}/package.json`);
  await fs.rm(TEMP_GEN_2_OUTPUT_DIR, { recursive: true });

  const packageLockPath = path.join(cwd, 'package-lock.json');
  const nodeModulesPath = path.join(cwd, 'node_modules');

  if (await pathExists(packageLockPath)) {
    logger.info('Deleting package-lock.json');
    await fs.rm(packageLockPath, { recursive: true });
  }

  if (await pathExists(nodeModulesPath)) {
    logger.info('Deleting node_modules');
    await fs.rm(nodeModulesPath, { recursive: true });
  }

  logger.info('Installing dependencies');
  await DependenciesInstaller.install();
}

/**
 * Checks if a file or directory exists at the given path.
 */
export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.stat(targetPath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
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
