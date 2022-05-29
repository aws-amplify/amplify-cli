import { ViewResourceTableParams } from './cliViewAPI';
import { ServiceSelection } from './serviceSelection';
import { Tag } from './tags';

export * from './cfnUtilities';
export * from './cliContext';
export * from './cliContextEnvironmentProvider';
export * from './cliEnvironmentProvider';
export * from './feature-flags';
export * from './permissionsBoundaryState';
export * from './jsonUtilities';
export * from './jsonValidationError';
export * from './serviceSelection';
export * from './state-manager';
export * from './tags';
export * from './errors';
export * from './exitOnNextTick';
export * from './isPackaged';
export * from './isCI';
export * from './cliConstants';
export * from './deploymentSecretsHelper';
export * from './deploymentState';
export * from './utils';
export * from './banner-message';
export * from './cliGetCategories';
export * from './cliRemoveResourcePrompt';
export * from './cliViewAPI';
export * from './overrides-manager';
export * from './hooks';
export * from './category-interfaces';
export * from './customPoliciesUtils';
export * from './utils/doc-links';
export * from './spinner';

// Temporary types until we can finish full type definition across the whole CLI

/**
 *  Use it for all 'any's where we can't define the type, but doing a strict TypeScript conversion
 */
export type $TSAny = any; // eslint-disable-line  @typescript-eslint/no-explicit-any

/**
 * Use it for all CLI Context class references, it enables a quick way to see what we have on the context
 */
export type $TSContext = {
  amplify: AmplifyToolkit;
  /**
   * Use printer from package amplify-prompts instead
   * @deprecated
   */
  print: IContextPrint;
  migrationInfo: $TSAny;
  projectHasMobileHubResources: boolean;
  prompt: $TSAny;
  exeInfo: $TSAny;
  input: $TSAny;
  parameters: $TSAny;
  usageData: $TSAny;
  runtime: $TSAny;
  pluginPlatform: IPluginPlatform;
  newUserInfo?: $TSAny;
  filesystem: IContextFilesystem;
  template: IContextTemplate;
  updatingAuth: $TSAny;
};

/**
 * type for category name
 */
export type CategoryName = string;

/**
 * type for resource name
 */
export type ResourceName = string;

/**
 * User amplify-prompts package instead
 * @deprecated
 */
export type IContextPrint = {
  /**
   * Use printer.info from amplify-prompts instead
   * @deprecated
   */
  info: (message: string) => void;
  /**
   * Why are you using this? If you really need it, implement it in amplify-prompts printer.ts
   * @deprecated
   */
  fancy: (message?: string) => void;
  /**
   * Use printer.warn from amplify-prompts instead
   * @deprecated
   */
  warning: (message: string) => void;
  /**
   * Use printer.error from amplify-prompts instead
   * @deprecated
   */
  error: (message: string) => void;
  /**
   * Use printer.success from amplify-prompts instead
   * @deprecated
   */
  success: (message: string) => void;
  /**
   *  The next time we refactor code that uses this function, refactor the table function into formatter.ts from amplify-prompts and use that instead
   * @deprecated
   */
  table: (data: string[][], options?: { format?: 'markdown' | 'lean' }) => void;
  /**
   *  Use printer.debug from amplify-prompts instead
   * @deprecated
   */
  debug: (message: string) => void;
  /**
   * Use printer.info from amplify-prompts and specify color
   * @deprecated
   */
  green: (message: string) => void;
  /**
   * Use printer.info from amplify-prompts and specify color
   * @deprecated
   */
  yellow: (message: string) => void;
  /**
   * Use printer.info from amplify-prompts and specify color
   * @deprecated
   */
  red: (message: string) => void;
  /**
   * Use printer.info from amplify-prompts and specify color
   * @deprecated
   */
  blue: (message: string) => void;
};

/**
 *
 */
export type IContextFilesystem = {
  remove: (targetPath: string) => void;
  read: (targetPath: string, encoding?: string) => $TSAny;
  write: (targetPath: string, data: unknown) => void;
  exists: (targetPath: string) => boolean;
  isFile: (targetPath: string) => boolean;
  path: (...pathParts: string[]) => string;
};

/**
 *
 */
export type IContextTemplate = {
  generate: (opts: { template: string; target: string; props: $TSObject; directory: string }) => string;
};

/**
 *
 */
export type IPluginPlatform = {
  pluginDirectories: string[];
  pluginPrefixes: string[];
  userAddedLocations: string[];
  lastScanTime: Date;
  maxScanIntervalInSeconds: number;
  plugins: IPluginCollection;
  excluded: IPluginCollection;
};

/**
 *
 */
export type IPluginCollection = {
  [pluginType: string]: IPluginInfo[];
};

/**
 *
 */
export type IPluginInfo = {
  packageName: string;
  packageVersion: string;
  packageLocation: string;
  manifest: $IPluginManifest;
};

/**
 *
 */
export type DeploymentSecrets = {
  appSecrets: Array<{
    rootStackId: string;

    environments: { [env: string]: { [category: string]: { [resourceName: string]: { [key: string]: string } } } };
  }>;
};

/**
 * Plugins or other packages bundled with the CLI that pass a file to a system command or execute a binary file must export a function named
 * "getPackageAssetPaths" of this type.
 *
 * The function must return the relative paths of all files and folders that the package passes into a system command.
 * If the package is an Amplify plugin, the path must be relative to the location of the amplify-plugin.json file
 * If the package is not an Amplify plugin, the path must be relative to the location of require.resolve('your-package')
 *
 * This function will be executed by the CLI during installation.
 *
 * At runtime, the assets can be retrieved at path.join(pathManager.getAmplifyPackageLibDirPath(packageName), relativePath)
 * where "pathManager" is the PathManager instance exported by this package,
 * "packageName" is the name of your package (used as a key to locate the assets),
 * and "relativePath" is the path to the asset relative to the root of the package.
 *
 * For example, suppose you have a package called "my-fancy-package".
 * This package expects at runtime to have access to all of the binary files in the folder "<package-root>/resources/binaries"
 * as well as access to a jar file at "<package-root>/resources/jars/myJar.jar"
 *
 * In that case, this package will export the following function:
 *
 * export const getPackageAssetPaths = () => ['resources/binaries', 'resources/jars/myJar.jar'];
 *
 * A binary could then be accessed at:
 * path.join(pathManager.getAmplifyPackageLibDirPath('my-fancy-package'), 'resources/binaries', 'myBinary')
 *
 * Likewise the jar can be retrieved at path.join(pathManager.getAmplifyPackageLibDirPath('my-fancy-package'), 'resources/jars/myJar.jar')
 */
export type GetPackageAssetPaths = () => Promise<string[]>;

/**
 *
 */
export type $IPluginManifest = $TSAny;

/**
 * Use it for all file content read from amplify-meta.json
 */
export type $TSMeta = $TSAny;

/**
 * Use it for all file content read from team-provider-info.json
 */
export type $TSTeamProviderInfo = $TSAny;

/**
 * Use it for all object initializer usages: {}
 */
export type $TSObject = Record<string, $TSAny>;

/**
 * There are tons of places where we use these two pieces of information to identify a resource
 * We can use this type to type those instances
 */
export interface ResourceTuple {
  category: string;
  resourceName: string;
}

/**
 * enum for supported Amplify frontends
 */
export enum AmplifyFrontend {
  android = 'android',
  ios = 'ios',
  javascript = 'javascript',
}
/**
 * AmplifyProjectConfig interface
 */
export interface AmplifyProjectConfig {
  projectName: string;
  version: string;
  frontend: AmplifyFrontend;
  providers: string[];
}

/**
 * higher level context object that could be used in plugins
 */
export interface ProviderContext {
  provider: string;
  service: string;
  projectName: string;
}

/**
 *
 */
export type $TSCopyJob = $TSAny;

// Temporary interface until Context refactor
interface AmplifyToolkit {
  confirmPrompt: (prompt: string, defaultValue?: boolean) => Promise<boolean>;
  constants: $TSAny;
  constructExeInfo: (context: $TSContext) => $TSAny;
  copyBatch: (context: $TSContext, jobs: $TSCopyJob[], props: $TSObject, force?: boolean, writeParams?: boolean | $TSObject) => $TSAny;
  crudFlow: (role: string, permissionMap?: $TSObject, defaults?: string[]) => Promise<string[]>;
  deleteProject: () => $TSAny;
  executeProviderUtils: (context: $TSContext, providerName: string, utilName: string, options?: $TSAny) => Promise<$TSAny>;
  getAllEnvs: () => string[];
  getPlugin: () => $TSAny;
  getCategoryPluginInfo: (context: $TSContext, category?: string, service?: string) => $TSAny;
  getAllCategoryPluginInfo: (context: $TSContext) => $TSAny;
  getFrontendPlugins: (context: $TSContext) => $TSAny;
  getEnvDetails: () => $TSAny;
  getEnvInfo: () => $TSAny;
  getProviderPlugins: (context: $TSContext) => Record<string, string>;
  getPluginInstance: (context: $TSContext, pluginName: string) => $TSAny;
  getProjectConfig: () => $TSAny;
  getProjectDetails: () => $TSAny;

  /**
   * Use stateManager.getMeta() from amplify-cli-core
   * @deprecated
   */
  getProjectMeta: () => $TSMeta;
  getResourceStatus: (category?: $TSAny, resourceName?: $TSAny, providerName?: $TSAny, filteredResources?: $TSAny) => $TSAny;
  getResourceOutputs: () => $TSAny;
  getWhen: () => $TSAny;
  /**
   * Use a validator from amplify-prompts or add a new validator in that module
   * @deprecated
   */
  inputValidation: (input: $TSAny) => (value: $TSAny) => boolean | string;
  listCategories: () => $TSAny;

  /**
   * use uuid
   * @deprecated
   */
  makeId: (n?: number) => string;
  openEditor: (context: $TSContext, target: string, waitToContinue?: boolean) => Promise<void>;
  onCategoryOutputsChange: (context: $TSContext, currentAmplifyMeta: $TSMeta | undefined, amplifyMeta?: $TSMeta) => $TSAny;
  pathManager: $TSAny;
  pressEnterToContinue: () => $TSAny;
  pushResources: (
    context: $TSContext,
    category?: string,
    resourceName?: string,
    filteredResources?: { category: string; resourceName: string }[],
    rebuild?: boolean,
  ) => $TSAny;
  storeCurrentCloudBackend: () => $TSAny;

  /**
   * use stateManager or JSONUtilities from amplify-cli-core
   * @deprecated
   */
  readJsonFile: (fileName: string) => $TSAny;
  removeDeploymentSecrets: (context: $TSContext, category: string, resource: string) => void;
  removeResource: (
    context: $TSContext,
    category: string,
    resource: string,
    questionOptions?: {
      headless?: boolean;
      serviceSuffix?: { [serviceName: string]: string };
      serviceDeletionInfo?: { [serviceName: string]: string };
    },
    resourceNameCallback?: (resourceName: string) => Promise<void>,
  ) => Promise<{ service: string; resourceName: string } | undefined>;
  sharedQuestions: () => $TSAny;
  showAllHelp: () => $TSAny;
  showHelp: (header: string, commands: { name: string; description: string }[]) => $TSAny;
  showHelpfulProviderLinks: (context: $TSContext) => $TSAny;
  showResourceTable: (category?: $TSAny, resourceName?: $TSAny, filteredResources?: $TSAny) => Promise<$TSAny>;
  showStatusTable: (resourceTableParams: ViewResourceTableParams) => Promise<$TSAny>; // Enhanced Status with CFN-Diff
  serviceSelectionPrompt: (
    context: $TSContext,
    category: string,
    servicesMetadata: $TSAny,
    customQuestion?: $TSAny,
    optionNameOverrides?: Record<string, string>,
  ) => Promise<ServiceSelection>;
  updateProjectConfig: () => $TSAny;
  updateamplifyMetaAfterResourceUpdate: (
    category: string,
    resourceName: string,
    metaResourceKey: string,
    metaResourceData?: $TSAny,
  ) => $TSMeta;
  updateamplifyMetaAfterResourceAdd: (
    category: string,
    resourceName: string,
    metaResourceData: $TSAny,
    backendResourceData?: $TSAny,
    overwriteObjectIfExists?: boolean,
  ) => void;
  updateamplifyMetaAfterResourceDelete: (category: string, resourceName: string) => void;
  updateProvideramplifyMeta: (providerName: string, options: $TSObject) => void;
  updateamplifyMetaAfterPush: (resources: $TSObject[]) => void;
  // buildType is from amplify-function-plugin-interface but can't be imported here because it would create a circular dependency
  updateamplifyMetaAfterBuild: (resource: ResourceTuple, buildType?: string) => void;
  updateAmplifyMetaAfterPackage: (resource: ResourceTuple, zipFilename: string, hash?: { resourceKey: string; hashValue: string }) => void;
  updateBackendConfigAfterResourceAdd: (category: string, resourceName: string, resourceData: $TSObject) => void;
  updateBackendConfigAfterResourceUpdate: (category: string, resourceName: string, attribute: string, value: $TSAny) => void;
  updateBackendConfigAfterResourceRemove: (category: string, resourceName: string) => void;
  loadEnvResourceParameters: (context: $TSContext, category: string, resourceName: string) => $TSAny;
  saveEnvResourceParameters: (context: $TSContext, category: string, resourceName: string, envSpecificParams?: $TSObject) => void;
  removeResourceParameters: (context: $TSContext, category: string, resource: string) => void;
  triggerFlow: () => $TSAny;
  addTrigger: () => $TSAny;
  updateTrigger: () => $TSAny;
  deleteTrigger: (context: $TSContext, name: string, dir: string) => Promise<void>;
  deleteAllTriggers: (previouslySaved: $TSAny, resourceName: string, targetDir: string, context: $TSContext) => Promise<void>;
  deleteDeselectedTriggers: () => $TSAny;
  dependsOnBlock: (context: $TSContext, dependsOnKeys: string[], service: string) => $TSAny;
  getTriggerMetadata: () => $TSAny;
  getTriggerPermissions: (context: $TSContext, triggers: $TSAny, category: string, resourceName: string) => $TSAny;
  getTriggerEnvVariables: () => $TSAny;
  getTriggerEnvInputs: () => $TSAny;
  getUserPoolGroupList: () => $TSAny[];
  forceRemoveResource: (context: $TSContext, categoryName: string, name: string, dir: string) => $TSAny;
  writeObjectAsJson: () => $TSAny;
  hashDir: (dir: string, exclude: string[]) => Promise<string>;
  leaveBreadcrumbs: (category: string, resourceName: string, breadcrumbs: unknown) => void;
  readBreadcrumbs: (category: string, resourceName: string) => $TSAny;
  loadRuntimePlugin: (context: $TSContext, pluginId: string) => Promise<$TSAny>;
  getImportedAuthProperties: (context: $TSContext) => {
    imported: boolean;
    userPoolId?: string;
    authRoleArn?: string;
    authRoleName?: string;
    unauthRoleArn?: string;
    unauthRoleName?: string;
  };
  invokePluginMethod: <T>(context: $TSContext, category: string, service: string | undefined, method: string, args: $TSAny[]) => Promise<T>;
  getTags: (context: $TSContext) => Tag[],
}

export * from './plugin-facade';
