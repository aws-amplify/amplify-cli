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
import { FunctionsGenerator } from './output/functions/functions.generator';
import { AnalyticsGenerator } from './output/analytics/analytics.generator';
import { CustomResourcesGenerator } from './output/custom-resources/custom.generator';
import { AuthAccess, FunctionDefinition } from './output/auth/auth.renderer';
import { parseAuthAccessFromTemplate } from './input/auth-access-analyzer';

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

  // FunctionsGenerator.plan() must run first to populate functionNamesAndCategories,
  // which AuthGenerator and StorageGenerator depend on. But its operations are
  // added after auth and data so that imports appear in the correct order.
  const functionNamesAndCategories = new Map<string, string>();
  let functionOperations: AmplifyMigrationOperation[] = [];
  if (meta.function) {
    const functionsGenerator = new FunctionsGenerator(
      gen1App,
      backendGenerator,
      outputDir,
      functionNamesAndCategories,
      packageJsonGenerator,
    );
    functionOperations = await functionsGenerator.plan();
  }

  // Auth operations are split: the first generates auth/resource.ts and
  // contributes auth overrides. Late operations (provider setup) must run
  // after storage so they appear in the correct position in backend.ts.
  let lateAuthOperations: AmplifyMigrationOperation[] = [];
  if (meta.auth) {
    const functions = await buildFunctionDefinitions(gen1App);
    const authGenerator = new AuthGenerator(gen1App, backendGenerator, outputDir, functions);
    const authOps = await authGenerator.plan();
    if (authOps.length > 0) {
      generators.push({ plan: async () => [authOps[0]] });
    }
    lateAuthOperations = authOps.slice(1);
  }

  let storageGenerator: Generator | undefined;
  if (meta.storage) {
    storageGenerator = new StorageGenerator(gen1App, backendGenerator, outputDir, functionNamesAndCategories);
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
      generators.push(new RestApiGenerator(gen1App, backendGenerator, hasAuth, functionNamesAndCategories));
    }
  }

  if (meta.analytics) {
    generators.push(new AnalyticsGenerator(gen1App, backendGenerator, outputDir));
  }

  if (meta.custom) {
    generators.push(new CustomResourcesGenerator(gen1App, backendGenerator, packageJsonGenerator, outputDir));
  }

  // Infrastructure generators run last — BackendGenerator accumulates
  // contributions from all category generators above.
  generators.push(backendGenerator);
  generators.push(packageJsonGenerator);
  generators.push(new BackendPackageJsonGenerator(outputDir));
  generators.push(new TsConfigGenerator(outputDir));
  generators.push(new AmplifyYmlGenerator(gen1App));
  generators.push(new GitIgnoreGenerator());

  // Collect all operations. Function operations (pre-collected from
  // FunctionsGenerator.plan()) are inserted after category generators
  // but before infrastructure generators so that function imports and
  // defineBackend properties appear in the correct position.
  const operations: AmplifyMigrationOperation[] = [];
  let lateAuthInserted = false;
  for (const generator of generators) {
    // Insert function operations right before BackendGenerator runs.
    if (generator === backendGenerator && functionOperations.length > 0) {
      operations.push(...functionOperations);
    }
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
 * Builds FunctionDefinition[] from the Gen1 app's function category
 * for use by AuthGenerator (auth trigger access).
 */
async function buildFunctionDefinitions(gen1App: Gen1App): Promise<FunctionDefinition[]> {
  const functionCategory = await gen1App.fetchMetaCategory('function');
  if (!functionCategory) return [];

  const definitions: FunctionDefinition[] = [];
  for (const [resourceName, resourceValue] of Object.entries(functionCategory)) {
    const resourceMeta = resourceValue as Record<string, unknown>;
    const output = resourceMeta.output as Record<string, string> | undefined;
    const deployedName = output?.Name;
    if (!deployedName) continue;

    const config = await gen1App.aws.fetchFunctionConfig(deployedName);

    // Parse auth access from the function's CloudFormation template
    const authAccess = await readAuthAccessFromCloudBackend(gen1App, resourceName);

    definitions.push({
      resourceName,
      name: deployedName,
      category: 'function',
      entry: config?.Handler ? extractFilePathFromHandler(config.Handler) : undefined,
      timeoutSeconds: config?.Timeout,
      memoryMB: config?.MemorySize,
      runtime: config?.Runtime,
      environment: config?.Environment,
      authAccess,
    });
  }
  return definitions;
}

/**
 * Reads a function's CloudFormation template from the cloud backend
 * and extracts Cognito auth access permissions.
 */
async function readAuthAccessFromCloudBackend(gen1App: Gen1App, resourceName: string): Promise<AuthAccess | undefined> {
  const templatePath = `function/${resourceName}/${resourceName}-cloudformation-template.json`;
  const templateContent = await gen1App.readCloudBackendFile(templatePath);
  if (!templateContent) return undefined;

  const authAccess = parseAuthAccessFromTemplate(templateContent) as AuthAccess;
  return Object.keys(authAccess).length > 0 ? authAccess : undefined;
}

/**
 * Extracts the file path from an AWS Lambda handler string.
 */
function extractFilePathFromHandler(handler: string): string {
  const lastDotIndex = handler.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `./${handler}.js`;
  }
  return `./${handler.substring(0, lastDotIndex)}.js`;
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
