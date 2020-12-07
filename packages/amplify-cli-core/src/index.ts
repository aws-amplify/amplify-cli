import { ServiceSelection } from './serviceSelection';

export * from './cliContext';
export * from './cliContextEnvironmentProvider';
export * from './cliEnvironmentProvider';
export * from './feature-flags';
export * from './jsonUtilities';
export * from './jsonValidationError';
export * from './serviceSelection';
export * from './state-manager';
export * from './tags';
export * from './errors';
export * from './exitOnNextTick';
export * from './isPackaged';
export * from './cliConstants';
export * from './deploymentSecretsHelper';
export * from './deploymentState';

// Temporary types until we can finish full type definition across the whole CLI

// Use it for all 'any's where we can't define the type, but doing a strict TypeScript conversion
export type $TSAny = any;

// Use it for all CLI Context class references, it enables a quick way to see what we have on the context
export type $TSContext = {
  amplify: AmplifyToolkit;
  print: $TSAny;
  migrationInfo: $TSAny;
  projectHasMobileHubResources: boolean;
  prompt: $TSAny;
  exeInfo: $TSAny;
  input: $TSAny;
  parameters: $TSAny;
  usageData: $TSAny;
  runtime: $TSAny;
  pluginPlatform: IPluginPlatform;
};

export type IPluginPlatform = {
  pluginDirectories: string[];
  pluginPrefixes: string[];
  userAddedLocations: string[];
  lastScanTime: Date;
  maxScanIntervalInSeconds: Number;
  plugins: IPluginCollection;
  excluded: IPluginCollection;
};

export type IPluginCollection = {
  [pluginType: string]: IPluginInfo[];
};

export type IPluginInfo = {
  packageName: string;
  packageVersion: string;
  packageLocation: string;
  manifest: $IPluginManifest;
};

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
 * A binary could then be accessed at path.join(pathManager.getAmplifyPackageLibDirPath('my-fancy-package'), 'resources/binaries', 'myBinary')
 * Likewise the jar can be retrieved at path.join(pathManager.getAmplifyPackageLibDirPath('my-fancy-package'), 'resources/jars/myJar.jar')
 */
export type GetPackageAssetPaths = () => Promise<string[]>;

export type $IPluginManifest = $TSAny;

// Use it for all file content read from amplify-meta.json
export type $TSMeta = any;

// Use it for all file content read from team-provider-info.json
export type $TSTeamProviderInfo = any;

// Use it for all object initializer usages: {}
export type $TSObject = Record<string, $TSAny>;

export enum AmplifyFrontend {
  android = 'android',
  ios = 'ios',
  javascript = 'javascript',
}
export interface AmplifyProjectConfig {
  projectName: string;
  version: string;
  frontend: AmplifyFrontend;
  providers: string[];
}

// Temporary interface until Context refactor
interface AmplifyToolkit {
  buildResources: () => $TSAny;
  confirmPrompt: (prompt: string, defaultValue?: boolean) => $TSAny;
  constants: $TSAny;
  constructExeInfo: () => $TSAny;
  copyBatch: () => $TSAny;
  crudFlow: () => $TSAny;
  deleteProject: () => $TSAny;
  executeProviderUtils: () => $TSAny;
  getAllEnvs: () => $TSAny;
  getPlugin: () => $TSAny;
  getCategoryPluginInfo: (context: $TSContext, category?: string, service?: string) => $TSAny;
  getAllCategoryPluginInfo: (context: $TSContext) => $TSAny;
  getFrontendPlugins: () => $TSAny;
  getEnvDetails: () => $TSAny;
  getEnvInfo: () => $TSAny;
  getProviderPlugins: (context: $TSContext) => $TSAny;
  getPluginInstance: () => $TSAny;
  getProjectConfig: () => $TSAny;
  getProjectDetails: () => $TSAny;
  getProjectMeta: () => $TSMeta;
  getResourceStatus: (category?: $TSAny, resourceName?: $TSAny, providerName?: $TSAny, filteredResources?: $TSAny) => $TSAny;
  getResourceOutputs: () => $TSAny;
  getWhen: () => $TSAny;
  inputValidation: (input: $TSAny) => $TSAny;
  listCategories: () => $TSAny;
  makeId: () => $TSAny;
  openEditor: () => $TSAny;
  onCategoryOutputsChange: (context: $TSContext, currentAmplifyMeta: $TSMeta | undefined, amplifyMeta?: $TSMeta) => $TSAny;
  pathManager: () => $TSAny;
  pressEnterToContinue: () => $TSAny;
  pushResources: () => $TSAny;
  storeCurrentCloudBackend: () => $TSAny;
  readJsonFile: () => $TSAny;
  removeEnvFromCloud: () => $TSAny;
  removeResource: () => $TSAny;
  sharedQuestions: () => $TSAny;
  showAllHelp: () => $TSAny;
  showHelp: () => $TSAny;
  showHelpfulProviderLinks: () => $TSAny;
  showResourceTable: () => $TSAny;
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
    metaResourceKey?: $TSAny,
    metaResourceData?: $TSAny,
  ) => $TSAny;
  updateamplifyMetaAfterResourceAdd: (
    category: string,
    resourceName: string,
    metaResourceData: $TSAny,
    backendResourceData?: $TSAny,
    overwriteObjectIfExists?: boolean,
  ) => $TSAny;
  updateamplifyMetaAfterResourceDelete: () => $TSAny;
  updateProvideramplifyMeta: () => $TSAny;
  updateamplifyMetaAfterPush: () => $TSAny;
  updateamplifyMetaAfterBuild: () => $TSAny;
  updateAmplifyMetaAfterPackage: () => $TSAny;
  updateBackendConfigAfterResourceAdd: (category: string, resourceName: string, resourceData: $TSAny) => $TSAny;
  updateBackendConfigAfterResourceUpdate: () => $TSAny;
  updateBackendConfigAfterResourceRemove: () => $TSAny;
  loadEnvResourceParameters: (context: $TSContext, category: string, resourceName: string) => $TSAny;
  saveEnvResourceParameters: (context: $TSContext, category: string, resourceName: string, envSpecificParams: $TSObject) => $TSAny;
  removeResourceParameters: () => $TSAny;
  triggerFlow: () => $TSAny;
  addTrigger: () => $TSAny;
  updateTrigger: () => $TSAny;
  deleteTrigger: () => $TSAny;
  deleteAllTriggers: () => $TSAny;
  deleteDeselectedTriggers: () => $TSAny;
  dependsOnBlock: () => $TSAny;
  getTriggerMetadata: () => $TSAny;
  getTriggerPermissions: () => $TSAny;
  getTriggerEnvVariables: () => $TSAny;
  getTriggerEnvInputs: () => $TSAny;
  getUserPoolGroupList: () => $TSAny;
  forceRemoveResource: () => $TSAny;
  writeObjectAsJson: () => $TSAny;
  hashDir: () => $TSAny;
  leaveBreadcrumbs: () => $TSAny;
  readBreadcrumbs: () => $TSAny;
  loadRuntimePlugin: () => $TSAny;
  getImportedAuthProperties: (
    context: $TSContext,
  ) => {
    imported: boolean;
    userPoolId?: string;
    authRoleArn?: string;
    authRoleName?: string;
    unauthRoleArn?: string;
    unauthRoleName?: string;
  };
  invokePluginMethod: <T>(context: $TSContext, category: string, service: string | null, method: string, args: any[]) => Promise<T>;
}
