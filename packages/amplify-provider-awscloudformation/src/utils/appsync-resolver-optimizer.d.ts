import { $TSContext } from '@aws-amplify/amplify-cli-core';

/**
 * Result of VTL file comparison
 */
export interface VtlComparisonResult {
  /** Whether the files have changes */
  hasChanges: boolean;
  /** Details of the changes detected */
  changes?: {
    /** Lines added */
    additions?: number;
    /** Lines removed */
    deletions?: number;
    /** Specific change details */
    details?: string[];
  };
}

/**
 * Validation result for deployment prerequisites
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Previous deployment root key if exists */
  oldDeploymentRootKey?: string | null;
  /** Path to current CloudFormation template */
  cfFilePath?: string;
  /** Path to old CloudFormation template */
  oldCfFilePath?: string;
  /** Validation error message if failed */
  errorMessage?: string;
}

/**
 * CloudFormation template structure
 */
export interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Resources?: {
    [key: string]: CloudFormationResource;
  };
  Parameters?: Record<string, any>;
  Outputs?: Record<string, any>;
  Conditions?: Record<string, any>;
  Mappings?: Record<string, any>;
}

/**
 * CloudFormation resource definition
 */
export interface CloudFormationResource {
  Type: string;
  Properties?: Record<string, any>;
  DependsOn?: string | string[];
  Condition?: string;
  Metadata?: Record<string, any>;
}

/**
 * S3 location reference using CloudFormation intrinsic functions
 */
export interface S3Location {
  'Fn::Join': [string, Array<string | { Ref: string } | { 'Fn::GetAtt': string[] }>];
}

/**
 * AppSync function configuration resource
 */
export interface AppSyncFunctionResource extends CloudFormationResource {
  Type: 'AWS::AppSync::FunctionConfiguration';
  Properties: {
    ApiId: string | { Ref: string };
    Name: string;
    Description?: string;
    DataSourceName: string | { Ref: string };
    FunctionVersion: string;
    RequestMappingTemplateS3Location?: S3Location;
    ResponseMappingTemplateS3Location?: S3Location;
    RequestMappingTemplate?: string;
    ResponseMappingTemplate?: string;
  };
}

/**
 * Nested stack resource
 */
export interface NestedStackResource extends CloudFormationResource {
  Type: 'AWS::CloudFormation::Stack';
  Properties: {
    TemplateURL: string | S3Location;
    Parameters?: Record<string, any>;
    Tags?: Array<{
      Key: string;
      Value: string;
    }>;
  };
}

/**
 * Optimizes AppSync resolver deployment by reusing unchanged VTL templates
 *
 * This function analyzes CloudFormation templates and VTL files to determine which
 * resolver templates have changed. Unchanged templates reuse their existing S3 locations,
 * avoiding unnecessary uploads and improving deployment performance.
 *
 * @param context - Amplify CLI context object with print methods
 * @param category - Resource category (typically 'api')
 * @param resourceName - Name of the AppSync API resource
 * @param resourceBuildDir - Path to the build directory containing CloudFormation templates
 * @param deploymentRootKey - S3 deployment root key for the current deployment (e.g., 'amplify-appsync-files/abc123')
 * @param useDeprecatedParameters - Use timestamp-based deployment keys instead of hash-based (default: false)
 * @returns Promise that resolves when optimization is complete
 * @throws Error if CloudFormation template processing fails
 *
 * @example
 * ```typescript
 * await optimizeAppSyncResolverDeployment(
 *   context,
 *   'api',
 *   'myGraphQLApi',
 *   '/path/to/build',
 *   'amplify-appsync-files/hash123',
 *   false
 * );
 * ```
 */
export declare function optimizeAppSyncResolverDeployment(
  context: $TSContext,
  category: string,
  resourceName: string,
  resourceBuildDir: string,
  deploymentRootKey: string,
  useDeprecatedParameters?: boolean,
): Promise<void>;

/**
 * Validates deployment prerequisites before optimization
 * @internal
 */
declare function validateDeploymentPrerequisites(
  context: $TSContext,
  resourceName: string,
  resourceBuildDir: string,
  currentResourceDirectoryPath: string,
  useDeprecatedParameters: boolean,
): Promise<ValidationResult>;

/**
 * Checks if a deployment already exists in the specified directory
 * @internal
 */
declare function isExistingDeployment(directoryPath: string): boolean;

/**
 * Gets the deployment root key for a resource directory
 * @internal
 */
declare function getDeploymentRootKey(resourceDirectoryPath: string, useDeprecatedParameters: boolean): Promise<string>;

/**
 * Processes CloudFormation templates to optimize resolver uploads
 * @internal
 */
declare function processCloudFormationTemplates(
  cfFilePath: string,
  oldCfFilePath: string,
  currentResourceDirectoryPath: string,
  resourceBuildDir: string,
  deploymentRootKey: string,
  context: $TSContext,
): Promise<void>;

/**
 * Processes a nested stack for resolver optimization
 * @internal
 */
declare function processNestedStack(
  stackName: string,
  currentResourceDirectoryPath: string,
  resourceBuildDir: string,
  deploymentRootKey: string,
  context: $TSContext,
): Promise<void>;

/**
 * Optimizes AppSync resolvers within a nested stack
 * @internal
 */
declare function optimizeNestedStackResolvers(
  newNestedStack: CloudFormationTemplate,
  oldNestedStack: CloudFormationTemplate,
  stackName: string,
  currentResourceDirectoryPath: string,
  resourceBuildDir: string,
  deploymentRootKey: string,
  context: $TSContext,
): Promise<CloudFormationTemplate>;

/**
 * Optimizes request and response mapping templates for a resolver
 * @internal
 */
declare function optimizeResolverTemplates(
  newFunction: AppSyncFunctionResource,
  oldFunction: AppSyncFunctionResource,
  functionName: string,
  stackName: string,
  currentResourceDirectoryPath: string,
  resourceBuildDir: string,
  deploymentRootKey: string,
  context: $TSContext,
): Promise<void>;

/**
 * Optimizes a single mapping template (request or response)
 * @internal
 */
declare function optimizeMappingTemplate(
  newFunction: AppSyncFunctionResource,
  oldFunction: AppSyncFunctionResource,
  templateType: 'RequestMappingTemplateS3Location' | 'ResponseMappingTemplateS3Location',
  functionName: string,
  stackName: string,
  currentResourceDirectoryPath: string,
  resourceBuildDir: string,
  deploymentRootKey: string,
  context: $TSContext,
): void;

/**
 * Extracts filename from CloudFormation S3 location object
 * @internal
 */
declare function extractFileNameFromS3Location(s3Location: S3Location): string;

/**
 * Reuses existing S3 location for unchanged templates
 * @internal
 */
declare function reuseExistingS3Location(newLocation: S3Location, oldLocation: S3Location, deploymentRootKey: string): void;

/**
 * Reads and parses a JSON file
 * @internal
 */
declare function readJsonFile(filePath: string): any;

/**
 * Writes a JSON file with proper formatting (2-space indent)
 * @internal
 */
declare function writeJsonFile(filePath: string, data: any): void;

/**
 * Hashes a directory to generate a consistent deployment key
 * Excludes the 'build' folder from hashing
 *
 * @param directory - Path to the directory to hash
 * @returns Promise resolving to the hex-encoded hash string
 */
export declare function hashDirectory(directory: string): Promise<string>;
