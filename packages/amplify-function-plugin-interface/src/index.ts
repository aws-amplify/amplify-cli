/*
  Function Runtime Contributor Types
*/

// All Function Runtime Contributor plugins must export a function of this type named 'functionRuntimeContributorFactory'
export type FunctionRuntimeContributorFactory = (
  context: any,
) => Contributor<FunctionRuntimeParameters, RuntimeContributionRequest> & FunctionRuntimeLifecycleManager;

// Subset of FunctionParameters that defines the function runtime
export type FunctionRuntimeParameters = Pick<FunctionParameters, 'runtime'>;

/*
  Function Template Contributor Types
*/

// All Function Template Contributor plugins must export a function of this type named 'functionTemplateContributorFactory'
export type FunctionTemplateContributorFactory = (context: any) => Contributor<Partial<FunctionParameters>, TemplateContributionRequest>;

// Subset of FunctionParameters that defines the function template
export type FunctionTemplateParameters = Pick<FunctionParameters, 'dependsOn' | 'functionTemplate' | 'triggerEventSourceMappings'>;

// Generic interfaces / types for all contributors
// context is the Amplify core context object (unfourtunately no type for this)

export interface Contributor<T extends Partial<FunctionParameters>, K> {
  contribute(request: K): Promise<T>;
}

export interface FunctionRuntimeLifecycleManager {
  checkDependencies(runtimeValue: string): Promise<CheckDependenciesResult>;
  package(request: PackageRequest): Promise<PackageResult>;
  build(request: BuildRequest): Promise<BuildResult>;
  invoke(request: InvocationRequest): Promise<any>;
}

export type TemplateContributionRequest = {
  selection: string;
  contributionContext: {
    runtime: FunctionRuntime;
    functionName: string;
    resourceName: string;
  };
};

export type RuntimeContributionRequest = {
  selection: string;
  contributionContext: {
    functionName: string;
    resourceName: string;
  };
};

// Request sent to invoke a function
export type InvocationRequest = {
  srcRoot: string;
  env: string;
  runtime: string;
  handler: string;
  event: string;
  lastBuildTimestamp?: Date;
  envVars?: { [key: string]: string };
};

// Request sent to build a function
export type BuildRequest = {
  env: string;
  srcRoot: string;
  runtime: string;
  legacyBuildHookParams?: {
    projectRoot: string;
    resourceName: string;
  };
  lastBuildTimestamp?: Date;
};

// Request sent to package a function
export type PackageRequest = {
  env: string;
  srcRoot: string;
  dstFilename: string;
  runtime: string;
  lastBuildTimestamp: Date;
  lastPackageTimestamp?: Date;
};

// Result of building a function
export type BuildResult = {
  rebuilt: boolean; // whether or not a rebuild was performed
};

// Result of packaging a function
export type PackageResult = {
  packageHash?: string; // undefined if no repacking necessary. Otherwise, it is a hash that uniquiely identifies the package
};

export type CheckDependenciesResult = {
  hasRequiredDependencies: boolean;
  errorMessage?: string;
};

/**
 * Data structure that represents a Function.
 */
export type FunctionParameters = {
  providerContext: ProviderContext; // higher level context around the function
  cloudResourceTemplatePath: string; // absolute path to the cloud resource template (for now this is always a CFN template)
  resourceName: string; // name of this resource
  functionName: string; // name of this function
  runtime: FunctionRuntime; // runtime metadata for the function
  roleName: string; // IAM role that this function will assume
  dependsOn?: FunctionDependency[]; // resources this function depends on
  functionTemplate?: FunctionTemplate; // fully describes the template that will be used
  categoryPolicies?: object[]; // IAM policies that should be applied to this lambda
  skipEdit?: boolean; // Whether or not to prompt to edit the function after creation
  mutableParametersState?: any; // Contains the object that is written to function-parameters.json. Kindof a hold-over from older code
  environmentMap?: Record<string, any>; // Existing function environment variable map. Should refactor to use dependsOn directly
  triggerEventSourceMappings?: any; // Used for dynamo / kinesis function triggers. May want to refactor
  topLevelComment?: string; // LEGACY Used to write available environment variables at top of template files
  runtimePluginId: string;
  cloudwatchRule?: string;
  lambdaLayers: LambdaLayer[];
};

/**
 * Deprecated
 *
 * This is the old parameters object that was used to define trigger templates.
 * New changes should use the above FunctionParameters (with modifications if necessary)
 */
export interface FunctionTriggerParameters {
  trigger: boolean; // discriminant to determine if parameters are trigger params
  key: string; // name of the trigger template
  modules: any[];
  parentResource: string;
  functionName: string;
  resourceName: string;
  parentStack: string;
  triggerEnvs: any;
  triggerIndexPath: string;
  triggerPackagePath: string;
  triggerDir: string;
  roleName: string;
  triggerTemplate: string;
  triggerEventPath: string;
  skipEdit: boolean;
  functionTemplate?: FunctionTemplate;
  cloudResourceTemplatePath?: string;
}

export interface ProviderContext {
  provider: string;
  service: string;
  projectName: string;
}

export interface FunctionRuntime {
  name: string; // Name presented to users in the CLI
  value: string; // value used internally to identify this runtime
  cloudTemplateValue: string; // value set in the CFN file
  defaultHandler: string; // default handler to set in the CFN file
  layerExecutablePath?: string; // directory structure for Lambda Layers
  layerDefaultFiles?: LayerFiles[]; // files that should be autogenerated for the layer
}

export interface LayerFiles {
  path: string;
  filename: string;
  content?: any;
}

export interface FunctionTemplate {
  handler?: string; // lambda handler entry point in the template
  parameters?: any; // map of parameters to populate the template files
  sourceRoot: string; // absolute path to the root of the template source files
  sourceFiles: string[]; // relative paths from sourceRoot to the template files
  destMap?: { [name: string]: string }; // optional map of sourceFiles to destination paths
  defaultEditorFile?: string; // file opened by default when editing this template. If not specified, the first file in sourceFiles is used
}

/**
 * Designed to be backwards compatible with the old way of representing dependencies as
 * {
 *    category: string
 *    resourceName: string
 *    attributes: string[]
 * }
 * and auto-generating environemnt variable names based on this info
 * When attributeEnvMap is specified, it can specify a custom environment variable name for a dependency attribute
 * If no mapping is found for an attribute in the map, then it falls back to the autogenerated value
 */
export interface FunctionDependency {
  category: string; // resource category of the dependency
  resourceName: string; // name of the dependency
  attributes: string[]; // attributes that this function depends on (must be outputs of the dependencies CFN template)
  attributeEnvMap?: { [name: string]: string }; // optional attributes to environment variable names map that will be exposed to the function
}

export type LambdaLayer = ProjectLayer | ExternalLayer;
export interface ProjectLayer {
  type: 'ProjectLayer';
  resourceName: string;
  version: number;
}

export interface ExternalLayer {
  type: 'ExternalLayer';
  arn: string;
}

interface FunctionContributorCondition {
  provider?: string;
  services?: Array<string>;
  runtime?: string | Array<string>;
}

export type FunctionTemplateCondition = FunctionContributorCondition;
export type FunctionRuntimeCondition = Pick<FunctionContributorCondition, 'provider' | 'services'>;

export interface FunctionBreadcrumbs {
  pluginId: string;
  functionRuntime: string;
  useLegacyBuild: boolean;
  defaultEditorFile: string;
  scripts?: Record<'build' & 'package', FunctionScript>;
}

export interface FunctionScript {
  type: 'file' | 'inline';
  value: string;
}
