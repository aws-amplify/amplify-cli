import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { printNodes } from '../ts-writer';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import { FunctionsRenderer, RenderDefineFunctionOptions } from './functions.renderer';

const factory = ts.factory;

// Maps Gen1 environment variable patterns to Gen2 backend resource paths
const ENV_VAR_PATTERNS: Record<string, string> = {
  'API_.*_GRAPHQLAPIENDPOINTOUTPUT': 'data.graphqlUrl',
  'API_.*_GRAPHQLAPIIDOUTPUT': 'data.apiId',
  'API_.*_GRAPHQLAPIKEYOUTPUT': 'data.apiKey!',
  'API_.*TABLE_ARN': 'data.resources.tables[{table}].tableArn',
  'API_.*TABLE_NAME': 'data.resources.tables[{table}].tableName',
  'AUTH_.*_USERPOOLID': 'auth.resources.userPool.userPoolId',
  'STORAGE_.*_ARN': '{table}.tableArn',
  'STORAGE_.*_NAME': '{table}.tableName',
  'STORAGE_.*_STREAMARN': '{table}.tableStreamArn!',
  'STORAGE_.*_BUCKETNAME': 'storage.resources.bucket.bucketName',
  'FUNCTION_.*_NAME': '{function}.resources.lambda.functionName',
};

// Env var suffixes that should be filtered out and handled as escape hatches
const FILTERED_ENV_SUFFIXES = ['GRAPHQLAPIKEYOUTPUT', 'GRAPHQLAPIENDPOINTOUTPUT', 'GRAPHQLAPIIDOUTPUT', 'TABLE_ARN', 'TABLE_NAME'];

const STORAGE_ENV_SUFFIXES = ['ARN', 'NAME', 'STREAMARN', 'BUCKETNAME'];
const AUTH_ENV_SUFFIXES = ['USERPOOLID'];

/**
 * Resolved function definition combining local metadata and AWS config.
 */
interface ResolvedFunction {
  readonly resourceName: string;
  readonly category: string;
  readonly entry: string;
  readonly deployedName: string;
  readonly timeoutSeconds?: number;
  readonly memoryMB?: number;
  readonly runtime?: string;
  readonly schedule?: string;
  readonly environment?: Record<string, string>;
  readonly filteredEnvironmentVariables: Record<string, string>;
}
/**
 * Generates Lambda function resources and contributes to backend.ts.
 *
 * For each function in the Gen1 app:
 * 1. Fetches Lambda config via Gen1App.aws.fetchFunctionConfig()
 * 2. Fetches CloudWatch schedules via Gen1App.aws.fetchFunctionSchedule()
 * 3. Identifies trigger relationships (auth, storage, scheduled)
 * 4. Generates amplify/{category}/{name}/resource.ts with defineFunction()
 * 5. Copies Gen1 function source files
 * 6. Contributes function imports, name overrides, env var escape hatches to backend.ts
 */
export class FunctionsGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly defineFunction: FunctionsRenderer;
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
    this.defineFunction = new FunctionsRenderer();
    this.functionNamesAndCategories = functionNamesAndCategories;
  }

  /**
   * Plans the function generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const functionCategory = await this.gen1App.fetchMetaCategory('function');
    if (!functionCategory) {
      return [];
    }

    const meta = await this.gen1App.fetchMeta();
    const categoryMap = this.buildCategoryMap(meta);
    const resolvedFunctions = await this.resolveFunctions(functionCategory, categoryMap);

    if (resolvedFunctions.length === 0) {
      return [];
    }

    // Populate the shared functionNamesAndCategories map
    for (const func of resolvedFunctions) {
      this.functionNamesAndCategories.set(func.resourceName, func.category);
    }

    const operations: AmplifyMigrationOperation[] = [];

    for (const func of resolvedFunctions) {
      operations.push(this.planFunction(func));
    }

    // Contribute env var escape hatches to backend.ts
    const functionsWithFilteredEnvVars = resolvedFunctions.filter(
      (f) => Object.keys(f.filteredEnvironmentVariables).length > 0,
    );
    if (functionsWithFilteredEnvVars.length > 0) {
      operations.push({
        describe: async () => ['Generate function environment variable escape hatches in backend.ts'],
        execute: async () => {
          for (const func of functionsWithFilteredEnvVars) {
            const statements = generateLambdaEnvVars(func.resourceName, func.filteredEnvironmentVariables);
            for (const stmt of statements) {
              this.backendGenerator.addStatement(stmt);
            }
          }
        },
      });
    }

    return operations;
  }

  private planFunction(func: ResolvedFunction): AmplifyMigrationOperation {
    const dirPath = path.join(this.outputDir, 'amplify', func.category, func.resourceName);

    return {
      describe: async () => [`Generate ${func.category}/${func.resourceName}/resource.ts`],
      execute: async () => {
        const renderOpts: RenderDefineFunctionOptions = {
          resourceName: func.resourceName,
          entry: func.entry,
          name: func.deployedName,
          timeoutSeconds: func.timeoutSeconds,
          memoryMB: func.memoryMB,
          runtime: func.runtime,
          schedule: func.schedule,
          environment: func.environment,
        };

        const nodes = this.defineFunction.render(renderOpts);
        const content = printNodes(nodes);

        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(path.join(dirPath, 'resource.ts'), content, 'utf-8');

        // Copy Gen1 function source files
        await this.copyFunctionSource(func.resourceName, dirPath);

        // Contribute to backend.ts
        this.backendGenerator.addImport(`./${func.category}/${func.resourceName}/resource`, [func.resourceName]);
        this.backendGenerator.addDefineBackendProperty(
          factory.createShorthandPropertyAssignment(factory.createIdentifier(func.resourceName)),
        );
      },
    };
  }

  private async resolveFunctions(
    functionCategory: Record<string, unknown>,
    categoryMap: Map<string, string>,
  ): Promise<ResolvedFunction[]> {
    const resolved: ResolvedFunction[] = [];

    for (const [resourceName, resourceValue] of Object.entries(functionCategory)) {
      const resourceMeta = resourceValue as Record<string, unknown>;
      const output = resourceMeta.output as Record<string, string> | undefined;
      const deployedName = output?.Name;
      if (!deployedName) continue;

      const config = await this.gen1App.aws.fetchFunctionConfig(deployedName);
      if (!config) continue;

      const runtime = config.Runtime;
      if (runtime && !runtime.startsWith('nodejs')) {
        throw new Error(
          `Function '${deployedName}' uses unsupported runtime '${runtime}'. Gen 2 migration only supports Node.js functions.`,
        );
      }

      const schedule = await this.gen1App.aws.fetchFunctionSchedule(deployedName);
      const category = categoryMap.get(resourceName) || 'function';
      const entry = extractFilePathFromHandler(config.Handler ?? 'index.js');

      // Filter environment variables that reference other Amplify resources
      const envVars = { ...(config.Environment?.Variables ?? {}) };
      const filteredEnvVars: Record<string, string> = {};
      filterResourceEnvVars(envVars, filteredEnvVars);

      resolved.push({
        resourceName,
        category,
        entry,
        deployedName,
        timeoutSeconds: config.Timeout,
        memoryMB: config.MemorySize,
        runtime,
        schedule,
        environment: Object.keys(envVars).length > 0 ? envVars : undefined,
        filteredEnvironmentVariables: filteredEnvVars,
      });
    }

    return resolved;
  }

  private buildCategoryMap(meta: Record<string, unknown>): Map<string, string> {
    const categoryMap = new Map<string, string>();
    const auth = meta.auth as Record<string, Record<string, unknown>> | undefined;
    const storage = meta.storage as Record<string, Record<string, unknown>> | undefined;
    const functions = meta.function as Record<string, Record<string, unkno
ageResource of Object.values(storage)) {
        if (storageResource.dependsOn) {
          for (const dep of storageResource.dependsOn as Array<{ category: string; resourceName: string }>) {
            if (dep.category === 'function') {
              categoryMap.set(dep.resourceName, 'storage');
            }
          }
        }
      }
    }

    // DynamoDB stream triggers (function depends on storage)
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

  private async copyFunctionSource(resourceName: string, destDir: string): Promise<void> {
    const rootDir = pathManager.findProjectRoot();
    if (!rootDir) return;

    const srcDir = path.join(rootDir, 'amplify', 'backend', 'function', resourceName, 'src');
    try {
      await fs.cp(srcDir, destDir, {
        recursive: true,
        filter: (src) => {
          const basename = path.basename(src);
          return basename !== 'node_modules' && basename !== '.yarn';
        },
      });
    } catch {
      // Source directory may not exist for some functions
    }
  }
}

/**
 * Extracts the file path from an AWS Lambda handler string.
 * 'index.handler' → './index.js', 'src/handler.myFunction' → './src/handler.js'
 */
function extractFilePathFromHandler(handler: string): string {
  const lastDotIndex = handler.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `./${handler}.js`;
  }
  return `./${handler.substring(0, lastDotIndex)}.js`;
}

/**
 * Filters environment variables that reference other Amplify resources.
 * Moves them from envVars to filteredEnvVars.
 */
function filterResourceEnvVars(
  envVars: Record<string, string>,
  filteredEnvVars: Record<string, string>,
): void {
  for (const variable of Object.keys(envVars)) {
    let shouldFilter = false;

    if (variable.startsWith('API_')) {
      shouldFilter = FILTERED_ENV_SUFFIXES.some((suffix) => variable.endsWith(suffix));
    } else if (variable.startsWith('STORAGE_')) {
      shouldFilter = STORAGE_ENV_SUFFIXES.some((suffix) => variable.endsWith(suffix));
    } else if (variable.startsWith('AUTH_')) {
      shouldFilter = AUTH_ENV_SUFFIXES.some((suffix) => variable.endsWith(suffix));
    }

    if (shouldFilter) {
      filteredEnvVars[variable] = envVars[variable];
      delete envVars[variable];
    }
  }
}

/**
 * Generates escape hatch statements for Lambda function environment variables.
 * Creates backend.functionName.addEnvironment() calls for Gen1 env vars
 * that reference other Amplify resources.
 */
function generateLambdaEnvVars(functionName: string, envVars: Record<string, string>): ts.ExpressionStatement[] {
  const statements: ts.ExpressionStatement[] = [];

  for (const envVar of Object.keys(envVars)) {
    for (const [pattern, backendPath] of Object.entries(ENV_VAR_PATTERNS)) {
      if (!new RegExp(`^${pattern}$`).test(envVar)) continue;

      let resolvedPath = backendPath;
      let isDirect = false;

      // Extract table name from environment variable for DynamoDB resources
      if (resolvedPath.includes('{table}')) {
        const tableName = extractTableName(envVar);
        if (tableName) {
          resolvedPath = resolvedPath.replace('{table}', tableName);
          isDirect = envVar.startsWith('STORAGE_');
        }
      }

      // Extract function name from environment variable
      if (resolvedPath.includes('{function}')) {
        const funcMatch = envVar.match(/FUNCTION_(.+?)_NAME/);
        if (funcMatch) {
          resolvedPath = resolvedPath.replace('{function}', funcMatch[1].toLowerCase());
        }
      }

      const expression = isDirect
        ? buildDirectExpression(resolvedPath)
        : buildBackendExpression(resolvedPath);

      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier(functionName)),
              factory.createIdentifier('addEnvironment'),
            ),
            undefined,
            [factory.createStringLiteral(envVar), expression],
          ),
        ),
      );
      break;
    }
  }

  return statements;
}

function extractTableName(envVar: string): string | undefined {
  if (envVar.startsWith('API_') && envVar.includes('TABLE_')) {
    const match = envVar.match(/API_.*_(.+?)TABLE_/);
    if (match) {
      const raw = match[1];
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
  } else if (envVar.startsWith('STORAGE_')) {
    const storageMatch = envVar.match(/STORAGE_(.+?)TABLE_/);
    if (storageMatch) return storageMatch[1].toLowerCase();
    const fallbackMatch = envVar.match(/STORAGE_(.+?)_/);
    if (fallbackMatch) return fallbackMatch[1].toLowerCase();
  }
  return undefined;
}

function buildDirectExpression(pathStr: string): ts.Expression {
  const parts = pathStr.split('.');
  let expression: ts.Expression = factory.createIdentifier(parts[0]);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.endsWith('!')) {
      expression = factory.createNonNullExpression(
        factory.createPropertyAccessExpression(expression, factory.createIdentifier(part.slice(0, -1))),
      );
    } else {
      expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(part));
    }
  }
  return expression;
}

function buildBackendExpression(pathStr: string): ts.Expression {
  const parts = ['backend', ...pathStr.split('.')];
  let expression: ts.Expression = factory.createIdentifier(parts[0]);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.endsWith('!')) {
      expression = factory.createNonNullExpression(
        factory.createPropertyAccessExpression(expression, factory.createIdentifier(part.slice(0, -1))),
      );
    } else if (part.includes('[') && part.includes(']')) {
      const bracketMatch = part.match(/(.+?)\[(.+?)\](.*)/);
      if (bracketMatch) {
        const [, beforeBracket, insideBracket, afterBracket] = bracketMatch;
        expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(beforeBracket));
        expression = factory.createElementAccessExpression(expression, factory.createStringLiteral(insideBracket));
        if (afterBracket) {
          expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(afterBracket));
        }
      }
    } else {
      expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(part));
    }
  }
  return expression;
}
