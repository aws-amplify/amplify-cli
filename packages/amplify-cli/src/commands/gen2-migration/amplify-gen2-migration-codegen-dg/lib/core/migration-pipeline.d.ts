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
import { Renderer } from '../render_pipeline';
import { Lambda } from '../generators/functions/lambda';
import {
  AuthTriggerEvents,
  AuthLambdaTriggers,
  AuthDefinition,
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
  AccessPatterns,
  Permission,
  S3TriggerDefinition,
  StorageTriggerEvent,
  ServerSideEncryptionConfiguration,
} from '../generators/storage/index.js';
import { DataDefinition, DataTableMapping } from '../generators/data/index';
import { FunctionDefinition } from '../generators/functions/index';
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
  /** Custom CloudFormation resources that need manual migration */
  customResources?: Map<string, string>;
  /** Categories that cannot be automatically migrated */
  unsupportedCategories?: Map<string, string>;
  /** Custom file writer function for testing or alternative output methods */
  fileWriter?: (content: string, path: string) => Promise<void>;
}
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
export declare const createGen2Renderer: ({
  outputDir,
  backendEnvironmentName,
  auth,
  storage,
  data,
  functions,
  customResources,
  unsupportedCategories,
  fileWriter,
}: Readonly<Gen2RenderingOptions>) => Renderer;
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
//# sourceMappingURL=migration-pipeline.d.ts.map
