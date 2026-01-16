/**
 * Amplify Gen 2 Codegen Migration Tool
 *
 * This module provides the core functionality for migrating Amplify Gen 1 projects to Gen 2 format.
 * It orchestrates the transformation of Gen 1 configurations into Gen 2 TypeScript resource definitions
 * and project structure.
 *
 * Key Components:
 * - Renderer Pattern: Uses a pipeline of renderers to generate different parts of the Gen 2 project
 * - Category Processing: Handles auth, storage, data, functions, and custom resources
 * - File Generation: Creates the necessary directory structure and configuration files
 * - Type Safety: Provides comprehensive TypeScript interfaces for migration parameters
 */

import path from 'path';
import fs from 'node:fs/promises';
import { PackageJson, patchNpmPackageJson } from '../npm_package/renderer';
import { RenderPipeline, Renderer } from '../render_pipeline';
import { JsonRenderer } from '../renderers/package_json';
import { TypescriptNodeArrayRenderer } from '../renderers/typescript_block_node';
import { BackendRenderParameters, BackendSynthesizer } from '../backend/synthesizer';
import { EnsureDirectory } from '../renderers/ensure_directory';
import { Lambda } from '../generators/functions/lambda';
import {
  AuthTriggerEvents,
  AuthLambdaTriggers,
  AuthDefinition,
  renderAuthNode,
  SendingAccount,
  PolicyOverrides,
  PasswordPolicyPath,
  UserPoolMfaConfig,
  Group,
  Attribute,
  EmailOptions,
  LoginOptions,
  StandardAttribute,
  StandardAttributes,
  CustomAttribute,
  CustomAttributes,
  MultifactorOptions,
  OidcOptions,
  OidcEndPoints,
  MetadataOptions,
  SamlOptions,
  Scope,
  AttributeMappingRule,
  ReferenceAuth,
} from '../generators/auth/index';
import {
  StorageRenderParameters,
  renderStorage,
  AccessPatterns,
  Permission,
  S3TriggerDefinition,
  StorageTriggerEvent,
  ServerSideEncryptionConfiguration,
} from '../generators/storage';

import { DataDefinition, DataTableMapping, generateDataSource } from '../generators/data/index';
import { DataModelTableAccess } from '../codegen-head/data_model_access_parser';
import { ApiTriggerDetector, DynamoTriggerInfo } from '../adapters/functions/api-trigger-detector';

import { FunctionDefinition, renderFunctions } from '../generators/functions/index';
import assert from 'assert';
import { CdkFromCfn, KinesisAnalyticsDefinition, AnalyticsCodegenResult } from '../unsupported/cdk-from-cfn';
import { renderAnalytics, AnalyticsRenderParameters } from '../generators/analytics/index';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';

/**
 * Configuration options for Gen 2 rendering pipeline
 *
 * This interface defines all the parameters needed to migrate a Gen 1 Amplify project
 * to Gen 2 format, including resource definitions and output configuration.
 */
export interface Gen2RenderingOptions {
  /** Target directory where Gen 2 files will be generated */
  outputDir: string;

  /** Optional Amplify app ID for project identification */
  appId?: string;

  /** Backend environment name used for data table mapping resolution */
  backendEnvironmentName?: string | undefined;

  /** Root CloudFormation stack name for the Gen1 backend */
  rootStackName?: string;

  /** CloudFormation client for resolving stack parameters */
  cfnClient?: CloudFormationClient;

  /** Authentication configuration from Gen 1 project */
  auth?: AuthDefinition;

  /** Storage (S3) configuration parameters */
  storage?: StorageRenderParameters;

  /** Data (GraphQL/DynamoDB) schema definition */
  data?: DataDefinition;

  /** Lambda function definitions */
  functions?: FunctionDefinition[];

  /** Analytics (Kinesis) definitions from Gen 1 project */
  analytics?: Record<string, KinesisAnalyticsDefinition>;

  /** Custom CloudFormation resources that need manual migration */
  customResources?: Map<string, string>;

  /** Categories that cannot be automatically migrated */
  unsupportedCategories?: Map<string, string>;

  /** Custom file writer function for testing or alternative output methods */
  fileWriter?: (content: string, path: string) => Promise<void>;
}
/**
 * Creates a file writer function for the specified path
 * @param path - File path to write to
 * @returns Async function that writes content to the file
 */
const createFileWriter = (path: string) => async (content: string) => fs.writeFile(path, content);

/**
 * Extracts dependencies from Gen 1 function package.json
 * @param resourceName - Name of the function resource
 * @returns Object with dependencies and devDependencies
 */
const extractGen1FunctionDependencies = async (
  resourceName: string,
): Promise<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }> => {
  try {
    const packageJsonPath = path.join('amplify', 'backend', 'function', resourceName, 'src', 'package.json');
    const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    return {
      dependencies: packageJson.dependencies,
      devDependencies: packageJson.devDependencies,
    };
  } catch {
    // Safely return an empty dictionary if no package.json is found
    return {};
  }
};

/**
 * Merges dependencies from all Gen 1 functions, selecting highest version for conflicts
 * @param functions - Array of function definitions
 * @returns Combined dependencies and devDependencies
 */
const mergeAllFunctionDependencies = async (
  functions: FunctionDefinition[],
): Promise<{ dependencies: Record<string, string>; devDependencies: Record<string, string> }> => {
  const functionDeps: Record<string, string> = {};
  const functionDevDeps: Record<string, string> = {};

  const mergeWithHighestVersion = (target: Record<string, string>, source: Record<string, string>) => {
    for (const [pkg, version] of Object.entries(source)) {
      if (!target[pkg] || version > target[pkg]) {
        target[pkg] = version;
      }
    }
  };

  for (const func of functions) {
    if (func.resourceName) {
      const deps = await extractGen1FunctionDependencies(func.resourceName);
      mergeWithHighestVersion(functionDeps, deps.dependencies || {});
      mergeWithHighestVersion(functionDevDeps, deps.devDependencies || {});
    }
  }

  return { dependencies: functionDeps, devDependencies: functionDevDeps };
};

/**
 * Copies all files from Gen 1 function src directory to Gen 2 function directory
 * @param resourceName - Name of the function resource
 * @param destDir - Destination directory for Gen 2 function
 * @param fileWriter - Function to write files
 */
const copyGen1FunctionFiles = async (
  resourceName: string,
  destDir: string,
  fileWriter: (content: string, path: string) => Promise<void>,
): Promise<void> => {
  try {
    const gen1SrcDir = path.join('amplify', 'backend', 'function', resourceName, 'src');
    const srcEntries = await fs.readdir(gen1SrcDir, { recursive: true, withFileTypes: true });

    for (const entry of srcEntries) {
      if (entry.isFile()) {
        const file = path.relative(gen1SrcDir, path.join(entry.parentPath, entry.name));
        const fileName = path.basename(file);
        const skipFiles = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

        if (!skipFiles.includes(fileName)) {
          const srcPath = path.join(gen1SrcDir, file);
          const content = await fs.readFile(srcPath, 'utf-8');

          const destFile = file;
          const destPath = path.join(destDir, destFile);

          // Ensure destination directory exists
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fileWriter(content, destPath);
        }
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to copy Gen 1 function files for '${resourceName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

/**
 * Creates a Gen 2 renderer pipeline that transforms Gen 1 Amplify configurations
 * into Gen 2 TypeScript resource definitions and project structure.
 *
 * The renderer follows these steps:
 * 1. Sets up the Gen 2 directory structure (outputDir/amplify/)
 * 2. Generates configuration files (package.json, tsconfig.json)
 * 3. Processes each category (auth, storage, data, functions) if present
 * 4. Creates the main backend.ts file that imports all resources
 * 5. Handles custom resources and unsupported categories
 *
 * @param options - Configuration options for the rendering process
 * @returns A Renderer that can be executed to perform the migration
 */
export const createGen2Renderer = ({
  outputDir,
  auth,
  storage,
  data,
  functions,
  analytics,
  customResources,
  backendEnvironmentName,
  rootStackName,
  cfnClient,
  unsupportedCategories,
  fileWriter = (content, path) => createFileWriter(path)(content),
}: Readonly<Gen2RenderingOptions>): Renderer => {
  // Create directory structure renderers
  const ensureOutputDir = new EnsureDirectory(outputDir);
  const ensureAmplifyDirectory = new EnsureDirectory(path.join(outputDir, 'amplify'));
  // Generate amplify/package.json with ES module configuration
  const amplifyPackageJson = new JsonRenderer(
    async () => {
      // Merge dependencies from all Gen 1 functions
      const { dependencies: functionDeps, devDependencies: functionDevDeps } = functions?.length
        ? await mergeAllFunctionDependencies(functions)
        : { dependencies: {}, devDependencies: {} };

      return { type: 'module', dependencies: functionDeps, devDependencies: functionDevDeps };
    },
    (content) => fileWriter(content, path.join(outputDir, 'amplify', 'package.json')),
  );
  // Generate root package.json with Gen 2 dependencies
  const jsonRenderer = new JsonRenderer(
    async () => {
      let packageJson: PackageJson = {
        name: 'my-gen2-app',
      };
      try {
        const packageJsonContents = await fs.readFile(`./package.json`, { encoding: 'utf-8' });
        packageJson = JSON.parse(packageJsonContents);
      } catch (e) {
        // File doesn't exist or is inaccessible. Ignore.
      }

      // Restrict dev dependencies to specific versions based on create-amplify gen2 flow:
      // https://github.com/aws-amplify/amplify-backend/blob/2dab201cb9a222c3b8c396a46c17d661411839ab/packages/create-amplify/src/amplify_project_creator.ts#L15-L24
      return patchNpmPackageJson(packageJson, {
        'aws-cdk': '^2',
        'aws-cdk-lib': '^2',
        'ci-info': '^4.3.1',
        constructs: '^10.0.0',
        '@types/node': '*',
        '@aws-amplify/backend': '^1.18.0',
        '@aws-amplify/backend-cli': '^1.8.0',
        '@aws-amplify/backend-data': '^1.6.2',
        tsx: '^4.20.6',
        esbuild: '^0.27.0',
      });
    },
    (content) => fileWriter(content, path.join(outputDir, 'package.json')),
  );
  // Generate amplify/tsconfig.json with Gen 2 TypeScript configuration
  const amplifyTsConfigJson = new JsonRenderer(
    async () => ({
      compilerOptions: {
        target: 'es2022',
        module: 'es2022',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        // eslint-disable-next-line spellcheck/spell-checker
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
        paths: {
          '$amplify/*': ['../.amplify/generated/*'],
        },
      },
    }),
    (content) => fileWriter(content, path.join(outputDir, 'amplify', 'tsconfig.json')),
  );
  // Initialize backend synthesizer and render options
  const backendSynthesizer = new BackendSynthesizer();
  const backendRenderOptions: BackendRenderParameters = {};

  // Initialize renderer pipeline with base configuration files
  const renderers: Renderer[] = [ensureOutputDir, ensureAmplifyDirectory, amplifyPackageJson, amplifyTsConfigJson, jsonRenderer];

  // Handle categories that cannot be automatically migrated
  if (unsupportedCategories && unsupportedCategories.size >= 1) {
    backendRenderOptions.unsupportedCategories = unsupportedCategories;
  }

  if (analytics) {
    console.log('There are Analytics found in the Gen1 App');
    const cdkFromCfn = new CdkFromCfn(outputDir, fileWriter, cfnClient, rootStackName);
    const analyticsDir = path.join(outputDir, 'amplify', 'analytics');
    renderers.push(new EnsureDirectory(analyticsDir));

    // Process each analytics resource
    for (const analyticName of Object.keys(analytics)) {
      const analyticObj = analytics[analyticName];
      analyticObj.name = analyticName;

      if (analyticObj.service === 'Kinesis') {
        console.log('Analytics backed by Kinesis found, generating L1 Code');

        // Create a renderer that generates both the stack file and resource.ts
        renderers.push(
          new TypescriptNodeArrayRenderer(
            async () => {
              // Generate the stack file (e.g., todoprojectKinesis-stack.ts)
              const codegenResult: AnalyticsCodegenResult = await cdkFromCfn.generateKinesisAnalyticsL1Code(analyticObj);

              // Generate resource.ts using the analytics generator
              const analyticsParams: AnalyticsRenderParameters = {
                stackClassName: codegenResult.stackClassName,
                stackFileName: codegenResult.stackFileName,
                resourceName: codegenResult.resourceName,
                shardCount: codegenResult.shardCount,
              };

              return renderAnalytics(analyticsParams);
            },
            (content) => fileWriter(content, path.join(analyticsDir, 'resource.ts')),
          ),
        );

        backendRenderOptions.analytics = { importFrom: './analytics/resource' };
      } else {
        console.log('Analytics backed by Pinpoint found, still unsupported');
      }
    }
  }

  // Process Lambda functions - create resource.ts and handler.ts files
  const functionNames: string[] = [];
  const functionNamesAndCategory = new Map<string, string>();
  const functionsWithApiAccess = new Map<string, { hasQuery: boolean; hasMutation: boolean; hasSubscription: boolean }>();
  const functionsWithDataModelAccess = new Map<string, DataModelTableAccess[]>();

  // Detect DynamoDB triggers for functions
  const dynamoTriggers = functions ? ApiTriggerDetector.detectDynamoTriggers(functions) : [];
  if (functions && functions.length) {
    const functionEnvironments = new Map<string, Record<string, string>>();

    for (const func of functions) {
      if (func.name) {
        if (!func.runtime?.startsWith('nodejs')) {
          throw new Error(
            `Function '${func.name}' uses unsupported runtime '${func.runtime}'. Gen 2 migration only supports Node.js functions.`,
          );
        }
        const resourceName = func.resourceName;
        assert(resourceName);
        const funcCategory = func.category;
        assert(funcCategory);
        functionNamesAndCategory.set(resourceName, funcCategory);
        functionNames.push(resourceName);

        // Store function environment variables for escape hatch generation
        if (func.filteredEnvironmentVariables && Object.keys(func.filteredEnvironmentVariables).length > 0) {
          functionEnvironments.set(resourceName, func.filteredEnvironmentVariables);
        }

        // Track functions that have API access with specific permissions
        if (
          func.apiPermissions &&
          (func.apiPermissions.hasQuery || func.apiPermissions.hasMutation || func.apiPermissions.hasSubscription)
        ) {
          functionsWithApiAccess.set(resourceName, func.apiPermissions);
        }

        // Track functions that have data model access
        if (func.dataModelAccess && func.dataModelAccess.length > 0) {
          functionsWithDataModelAccess.set(resourceName, func.dataModelAccess);
        }
        const dirPath = path.join(outputDir, 'amplify', funcCategory, resourceName);
        // Create function directory and resource files
        renderers.push(new EnsureDirectory(dirPath));
        renderers.push(
          new TypescriptNodeArrayRenderer(
            async () => renderFunctions(func),
            (content) => {
              // Create both resource.ts (with function definition) and copy handler from Gen 1
              return fileWriter(content, path.join(dirPath, 'resource.ts')).then(() =>
                copyGen1FunctionFiles(resourceName, dirPath, fileWriter),
              );
            },
          ),
        );
      }
    }

    backendRenderOptions.function = {
      importFrom: './function/resource',
      functionNamesAndCategories: functionNamesAndCategory,
      functionsWithApiAccess: functionsWithApiAccess.size > 0 ? functionsWithApiAccess : undefined,
      functionEnvironments: functionEnvironments,
      functionsWithDataModelAccess: functionsWithDataModelAccess.size > 0 ? functionsWithDataModelAccess : undefined,
    };
  }

  // Process authentication configuration - create amplify/auth/resource.ts
  if (auth) {
    // Create function category map for correct import paths
    const functionCategories = new Map<string, string>();
    if (functions) {
      functions.forEach((func) => {
        if (func.resourceName && func.category) {
          functionCategories.set(func.resourceName, func.category);
        }
      });
    }

    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'auth')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => renderAuthNode(auth, functions, functionCategories),
        async (content) => {
          // Remove unused parameter and add type annotation
          let cleanedContent = content.replace(/\(allow, _unused\)/g, '(allow: any)');
          // Add trailing comma after access array
          cleanedContent = cleanedContent.replace(/(access: \(allow: any\) => \[[\s\S]*?\n {4}\])/g, '$1,');
          return fileWriter(cleanedContent, path.join(outputDir, 'amplify', 'auth', 'resource.ts'));
        },
      ),
    );
    // Configure auth parameters for backend synthesis
    backendRenderOptions.auth = {
      importFrom: './auth/resource',
      userPoolOverrides: auth?.userPoolOverrides,
      guestLogin: auth?.guestLogin,
      identityPoolName: auth?.identityPoolName,
      oAuthFlows: auth?.oAuthFlows,
      readAttributes: auth?.readAttributes,
      writeAttributes: auth?.writeAttributes,
      referenceAuth: auth?.referenceAuth,
      userPoolClient: auth?.userPoolClient,
    };
  }

  // Process data (GraphQL/DynamoDB) configuration - only if table mappings exist for the environment
  if (data) {
    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'data')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => generateDataSource(backendEnvironmentName, data),
        (content) => fileWriter(content, path.join(outputDir, 'amplify', 'data', 'resource.ts')),
      ),
    );
    backendRenderOptions.data = {
      importFrom: './data/resource',
      additionalAuthProviders: data.additionalAuthProviders,
      restApis: data.restApis,
    };
  }

  // Process storage configuration - create amplify/storage/resource.ts if S3 bucket is needed
  if (storage) {
    const hasS3Bucket = storage?.accessPatterns || storage?.storageIdentifier;

    if (hasS3Bucket) {
      renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'storage')));
      renderers.push(
        new TypescriptNodeArrayRenderer(
          async () => renderStorage({ ...storage, functionNamesAndCategories: functionNamesAndCategory }),
          (content) => fileWriter(content, path.join(outputDir, 'amplify', 'storage', 'resource.ts')),
        ),
      );
    }
    // Configure storage parameters for backend synthesis (includes both S3 and DynamoDB)
    backendRenderOptions.storage = {
      importFrom: './storage/resource',
      dynamoTables: storage.dynamoTables,
      dynamoFunctionAccess: storage.dynamoFunctionAccess,
      accelerateConfiguration: storage.accelerateConfiguration,
      versionConfiguration: storage.versioningConfiguration,
      hasS3Bucket: hasS3Bucket,
      bucketEncryptionAlgorithm: storage.bucketEncryptionAlgorithm,
      bucketName: storage.bucketName,
    };
  }

  // Handle custom CloudFormation resources that require manual migration
  if (customResources && customResources.size > 0) {
    backendRenderOptions.customResources = customResources;
  }

  // Handle DynamoDB triggers
  if (dynamoTriggers && dynamoTriggers.length > 0) {
    backendRenderOptions.dynamoTriggers = dynamoTriggers;
  }

  // Generate the main backend.ts file that imports and combines all resources
  const backendRenderer = new TypescriptNodeArrayRenderer(
    async () => backendSynthesizer.render(backendRenderOptions),
    (content) => fileWriter(content, path.join(outputDir, 'amplify', 'backend.ts')),
  );

  renderers.push(backendRenderer);

  // Return a pipeline that executes all renderers in sequence
  return new RenderPipeline(renderers);
};
export {
  Renderer,
  SendingAccount,
  UserPoolMfaConfig,
  StorageRenderParameters,
  AccessPatterns,
  Permission,
  S3TriggerDefinition,
  PasswordPolicyPath,
  AuthDefinition,
  FunctionDefinition,
  PolicyOverrides,
  Group,
  Attribute,
  EmailOptions,
  LoginOptions,
  StandardAttribute,
  StandardAttributes,
  CustomAttribute,
  CustomAttributes,
  MultifactorOptions,
  AuthTriggerEvents,
  Lambda,
  AuthLambdaTriggers,
  StorageTriggerEvent,
  DataDefinition,
  DataTableMapping,
  SamlOptions,
  OidcEndPoints,
  MetadataOptions,
  OidcOptions,
  Scope,
  AttributeMappingRule,
  ServerSideEncryptionConfiguration,
  ReferenceAuth,
};
