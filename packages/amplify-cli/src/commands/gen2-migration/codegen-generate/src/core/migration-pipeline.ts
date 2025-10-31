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
} from '../generators/storage/index.js';

import { DataDefinition, DataTableMapping, generateDataSource } from '../generators/data/index';

import { FunctionDefinition, renderFunctions } from '../generators/functions/index';
import assert from 'assert';

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

  /** Authentication configuration from Gen 1 project */
  auth?: AuthDefinition;

  /** Storage (S3) configuration parameters */
  storage?: StorageRenderParameters;

  /** Data (GraphQL/DynamoDB) schema definition */
  data?: DataDefinition;

  /** Lambda function definitions */
  functions?: FunctionDefinition[];

  analytics?: any;

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
  backendEnvironmentName,
  auth,
  storage,
  data,
  functions,
  analytics,
  customResources,
  unsupportedCategories,
  fileWriter = (content, path) => createFileWriter(path)(content),
}: Readonly<Gen2RenderingOptions>): Renderer => {
  // Create directory structure renderers
  const ensureOutputDir = new EnsureDirectory(outputDir);
  const ensureAmplifyDirectory = new EnsureDirectory(path.join(outputDir, 'amplify'));
  // Generate amplify/package.json with ES module configuration
  const amplifyPackageJson = new JsonRenderer(
    async () => ({ type: 'module' }),
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
        'ci-info': '^3.8.0',
        constructs: '^10.0.0',
        typescript: '^5.0.0',
        '@types/node': '*',
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
    console.log('analytics found');
    Object.keys(analytics).forEach((analytic) => {
      console.log('a', JSON.stringify(analytic));
      const analyticObj = analytics[analytic];
      if (analyticObj.service === 'Kinesis') {
        console.log('KINESIS');
        // TODO: cdk-from-cfn here
      } else {
        console.log('PINPOINT');
      }
    });
    backendRenderOptions.analytics = analytics;
  }

  // Process Lambda functions - create resource.ts and handler.ts files
  if (functions && functions.length) {
    const functionNamesAndCategory = new Map<string, string>();
    for (const func of functions) {
      if (func.name) {
        const resourceName = func.resourceName;
        assert(resourceName);
        const funcCategory = func.category;
        assert(funcCategory);
        functionNamesAndCategory.set(resourceName, funcCategory);
        const dirPath = path.join(outputDir, 'amplify', funcCategory, resourceName);
        // Create function directory and resource files
        renderers.push(new EnsureDirectory(dirPath));
        renderers.push(
          new TypescriptNodeArrayRenderer(
            async () => renderFunctions(func),
            (content) => {
              // Create both resource.ts (with function definition) and empty handler.ts
              return fileWriter(content, path.join(dirPath, 'resource.ts')).then(() => fileWriter('', path.join(dirPath, 'handler.ts')));
            },
          ),
        );
      }
    }

    backendRenderOptions.function = {
      importFrom: './function/resource',
      functionNamesAndCategories: functionNamesAndCategory,
    };
  }

  // Process authentication configuration - create amplify/auth/resource.ts
  if (auth) {
    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'auth')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => renderAuthNode(auth),
        (content) => fileWriter(content, path.join(outputDir, 'amplify', 'auth', 'resource.ts')),
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
  if (data && data.tableMappings && backendEnvironmentName && data.tableMappings[backendEnvironmentName] !== undefined) {
    renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'data')));
    renderers.push(
      new TypescriptNodeArrayRenderer(
        async () => generateDataSource(data),
        (content) => fileWriter(content, path.join(outputDir, 'amplify', 'data', 'resource.ts')),
      ),
    );
    backendRenderOptions.data = {
      importFrom: './data/resource',
    };
  }

  // Process storage configuration - create amplify/storage/resource.ts if S3 bucket is needed
  if (storage) {
    const hasS3Bucket = storage?.accessPatterns || storage?.storageIdentifier;
    if (hasS3Bucket) {
      renderers.push(new EnsureDirectory(path.join(outputDir, 'amplify', 'storage')));
      renderers.push(
        new TypescriptNodeArrayRenderer(
          async () => renderStorage(storage),
          (content) => fileWriter(content, path.join(outputDir, 'amplify', 'storage', 'resource.ts')),
        ),
      );
    }
    // Configure storage parameters for backend synthesis (includes both S3 and DynamoDB)
    backendRenderOptions.storage = {
      importFrom: './storage/resource',
      dynamoDB: storage.dynamoDB,
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
