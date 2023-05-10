/* eslint-disable-next-line import/no-cycle */
import { ViewResourceTableParams } from './cliViewAPI';
import { ServiceSelection } from './serviceSelection';
import { Tag } from './tags';
import { EnvironmentInfo, InputParameters, PinpointInfo, ProjectInfo } from './exeInfo';

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
  migrationInfo: MigrationInfo;
  projectHasMobileHubResources: boolean;
  /**
   * Use prompter from package amplify-prompts instead
   * @deprecated
   */
  prompt: $TSAny;
  exeInfo: EnvironmentInfo & InputParameters & PinpointInfo & ProjectInfo;
  input: CommandLineInput;
  parameters: ContextParameters;
  usageData: IUsageData;
  runtime: Runtime;
  pluginPlatform: IPluginPlatform;
  newUserInfo?: string;
  filesystem: IContextFilesystem;
  template: IContextTemplate;
};

export interface MigrationInfo {
  amplifyMeta: $TSMeta;
  newVersion: string;
  initVersion: string;
  currentAmplifyMeta: $TSMeta;
  projectConfig: ProjectConfig;
  projectPath: string;
  localEnvInfo: LocalEnvInfo;
  localAwsInfo: LocalAwsInfo;
  teamProviderInfo: TeamProviderInfo;
  backendConfig: Record<string, unknown>;
}
export type TeamProviderEnvironment = {
  categories: Record<string, unknown>;
};
export type TeamProviderInfo = {
  [envName: string]: Record<string, unknown>;
};
export type LocalAwsInfo = {
  NONE: Record<string, unknown>;
};

export type ProjectConfig<T extends string = ''> = Pick<
  ProjectSettings,
  'frontend' | 'version' | 'providers' | 'projectPath' | 'defaultEditor' | 'frontendHandler'
> &
  Record<T, string>;
export type LocalEnvInfo = Required<Pick<ProjectSettings, 'projectPath' | 'defaultEditor' | 'envName' | 'noUpdateBackend'>>;
export interface FlowRecorder {
  setIsHeadless: (headless: boolean) => void;
  pushHeadlessFlow: (headlessFlowDataString: string, input: CommandLineInput) => void;
  pushInteractiveFlow: (prompt: string, input: unknown) => void;
  getFlowReport: () => IFlowReport | Record<string, never>;
  assignProjectIdentifier: (envName?: string) => string | undefined;
}
export interface IUsageData extends IUsageMetricsData, FlowRecorder {}
export type ProjectSettings = {
  frontend?: string;
  editor?: string;
  envName: string;
  framework?: string;
  version?: string;
  providers?: string[];
  projectPath?: string;
  defaultEditor?: string;
  frontendHandler?: unknown;
  noUpdateBackend?: boolean;
};
export interface IUsageDataPayload {
  sessionUuid: string;
  installationUuid: string;
  amplifyCliVersion: string;
  input: CommandLineInput | null;
  inputOptions: CommandLineInput['options'];
  timestamp: string;
  error: SerializableError;
  downstreamException: SerializableError;
  payloadVersion: string;
  osPlatform: string;
  osRelease: string;
  nodeVersion: string;
  state: string;
  isCi: boolean;
  accountId: string;
  projectSetting: ProjectSettings;
  codePathDurations: Partial<Record<TimedCodePath, number>>;
  flowReport: IFlowReport;
  pushNormalizationFactor: number;
}

export type StackTraceElement = {
  methodName: string;
  file: string;
  lineNumber: string;
  columnNumber: string;
};
export type SerializableError = {
  name: string;
  message: string;
  details?: string;
  code?: string;
  trace?: StackTraceElement[];
};
export type InputOptions = Record<string, string | boolean>;
export interface IFlowReport {
  version: string;
  runtime: string;
  executable: string;
  category: string;
  isHeadless: boolean;
  cmd: string;
  subCmd: string | undefined;
  optionFlowData: Array<TypeOptionFlowData>; //IOptionFlowHeadlessData | IOptionFlowCLIData
  input: CommandLineInput;
  timestamp: string;
  projectEnvIdentifier?: string; // hash(ProjectName + Amplify AppId + EnvName)
  projectIdentifier?: string; // hash( ProjectName + Amplify App Id)
}
export type TimedCodePath = ManuallyTimedCodePath | UntilExitTimedCodePath | FromStartupTimedCodePaths;
export interface IUsageMetricsData {
  emitAbort: () => Promise<void>;
  emitError: (error: Error | null) => Promise<void>;
  emitSuccess: () => Promise<void>;
  init: (
    installationUuid: string,
    version: string,
    input: CommandLineInput,
    accountId: string,
    projectSettings: ProjectSettings,
    processStartTimeStamp: number,
  ) => void;
  getUsageDataPayload: (error: Error | null, state: string) => IUsageDataPayload;
  startCodePathTimer: (codePath: StartableTimedCodePath) => void;
  stopCodePathTimer: (codePath: StoppableTimedCodePath) => void;
  calculatePushNormalizationFactor: (events: { StackId: string; PhysicalResourceId: string }[], StackId: string) => void;
  getSessionUuid: () => string;
}

export type StartableTimedCodePath = ManuallyTimedCodePath | UntilExitTimedCodePath;
export type StoppableTimedCodePath = ManuallyTimedCodePath | FromStartupTimedCodePaths;

export enum FromStartupTimedCodePaths {
  PLATFORM_STARTUP = 'platformStartup', // time from CLI process start to plugin invoke. This timer is auto started on process startup
  TOTAL_DURATION = 'totalDuration', // time from CLI process start to exit
}
export enum UntilExitTimedCodePath {
  POST_PROCESS = 'postProcess', // time from plugin exit to process exit. This timer is automatically stopped at the end of the process
}
export enum ManuallyTimedCodePath {
  // general paths (applies to all commands)
  PLUGIN_TIME = 'pluginTime', // time spent in command handler plugin

  // push-specific paths
  PUSH_TRANSFORM = 'pushTransform', // total time spent transforming resources and uploading assets to prepare for a push
  PUSH_DEPLOYMENT = 'pushDeployment', // time spent deploying CFN

  // init-specific paths (also called during env checkout and pull)
  INIT_ENV_PLATFORM = 'initEnvPlatform', // time to call awscloudformation provider initEnv. This includes downloading deployment bucket and updating local files
  INIT_ENV_CATEGORIES = 'initEnvCategories', // time to call all of the category's initEnv methods

  PROMPT_TIME = 'promptTime', // total time to takes to answer a prompt
}

export interface ContextParameters extends Pick<CommandLineInput, 'argv' | 'plugin' | 'command' | 'options'> {
  raw: CommandLineInput['argv'];
  array: CommandLineInput['subCommands'];
  first?: string;
  second?: string;
  third?: string;
}

export type CLIGlobalFlags = {
  version?: boolean;
  help?: boolean;
  yes?: boolean;
};

export type CommandLineInput = {
  argv: Array<string>;
  plugin?: string;
  command: string;
  subCommands?: string[];
  options?: CLIGlobalFlags & Record<string, $TSAny>;
};

export type Plugin = {
  name: string;
  directory: string;
  pluginName: string;
  pluginType: string;
  commands: string[];
};

export type Runtime = {
  plugins: Plugin[];
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
   *  Use the table function into formatter.ts from amplify-prompts instead
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
 * Use stateManager from amplify-cli-core instead
 * @deprecated
 */
export type IContextFilesystem = {
  remove: (targetPath: string) => void;
  read: (targetPath: string, encoding?: BufferEncoding) => $TSAny;
  write: (targetPath: string, data: string | NodeJS.ArrayBufferView) => void;
  exists: (targetPath: string) => boolean;
  isFile: (targetPath: string) => boolean;
  path: (...pathParts: string[]) => string;
};

/**
 * ejs template interface
 * @deprecated
 */
export type IContextTemplate = {
  generate: (opts: { template: string; target: string; props: $TSObject; directory: string }) => Promise<string>;
};

/**
 * Plugin platform interface
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
 * Plugin collection interface
 */
export type IPluginCollection = {
  [pluginType: string]: IPluginInfo[];
};

/**
 * Plugin interface
 */
export type IPluginInfo = {
  packageName: string;
  packageVersion: string;
  packageLocation: string;
  manifest: IPluginManifest;
};

/**
 * Deployment secrets type
 */
export type DeploymentSecrets = {
  appSecrets: Array<{
    rootStackId: string;
    environments: { [env: string]: { [category: string]: { [resourceName: string]: { [key: string]: string } } } };
  }>;
};

/**
 * Plugins or other packages bundled with the CLI that pass a file to a system command or execute a binary, must export a function named
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
 * Placeholder type
 */
export type IPluginManifest = {
  name: string;
  type: string;
  commands?: string[];
  services?: string[];
  functionRuntime?: FunctionBreadcrumb;
};

export type FunctionBreadcrumb = {
  pluginId: string;
  functionRuntime: string;
  defaultEditorFile: string;
  useLegacyBuild: true;
};

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

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * enum for supported Amplify frontend choices
 */
export enum AmplifyFrontend {
  android = 'android',
  ios = 'ios',
  javascript = 'javascript',
  flutter = 'flutter',
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
 * Placeholder type
 */
export type $TSCopyJob = $TSAny;

// Temporary interface until Context refactor
interface AmplifyToolkit {
  confirmPrompt: (prompt: string, defaultValue?: boolean) => Promise<boolean>;
  constants: $TSAny;
  constructExeInfo: (context: $TSContext) => $TSAny;
  copyBatch: (context: $TSContext, jobs: $TSCopyJob[], props: $TSObject, force?: boolean, writeParams?: boolean | $TSObject) => $TSAny;
  crudFlow: (role: string, permissionMap?: $TSObject, defaults?: string[]) => Promise<string[]>;
  deleteProject: (context: $TSContext) => Promise<void>;
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
  getResourceStatus: (category?: $TSAny, resourceName?: $TSAny, providerName?: $TSAny, filteredResources?: $TSAny) => Promise<$TSAny>;
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
  storeCurrentCloudBackend: (context: $TSContext) => $TSAny;

  /**
   * use stateManager or JSONUtilities from amplify-cli-core
   * @deprecated
   */
  readJsonFile: (fileName: string) => $TSAny;
  removeDeploymentSecrets: (context: $TSContext, category: string, resource: string) => void;
  removeResource: (
    context: $TSContext,
    category: string,
    resource?: string,
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
  /* eslint-disable-next-line spellcheck/spell-checker */
  updateProviderAmplifyMeta: (providerName: string, options: $TSObject) => void;
  updateamplifyMetaAfterPush: (resources: $TSObject[]) => Promise<void>;
  // buildType is from amplify-function-plugin-interface but can't be imported here because it would create a circular dependency
  updateamplifyMetaAfterBuild: (resource: ResourceTuple, buildType?: string) => void;
  updateAmplifyMetaAfterPackage: (resource: ResourceTuple, zipFilename: string, hash?: { resourceKey: string; hashValue: string }) => void;
  updateBackendConfigAfterResourceAdd: (category: string, resourceName: string, resourceData: $TSObject) => void;
  updateBackendConfigAfterResourceUpdate: (category: string, resourceName: string, attribute: string, value: $TSAny) => void;
  updateBackendConfigAfterResourceRemove: (category: string, resourceName: string) => void;
  /**
   * use EnvironmentParameterManager from the amplify-environment-parameters package
   * @deprecated
   */
  loadEnvResourceParameters: (context: $TSContext, category: string, resourceName: string) => $TSAny;
  /**
   * use EnvironmentParameterManager from the amplify-environment-parameters package
   * @deprecated
   */
  saveEnvResourceParameters: (
    context: $TSContext | undefined,
    category: string,
    resourceName: string,
    envSpecificParams?: $TSObject,
  ) => void;
  removeResourceParameters: (context: $TSContext, category: string, resource: string) => void;
  triggerFlow: (...args: unknown[]) => $TSAny;
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
  getUserPoolGroupList: (context?: $TSContext) => $TSAny[];
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
  getTags: (context: $TSContext) => Tag[];
}
export interface IOptionFlowHeadlessData {
  input: string;
  timestamp: number;
}
export interface IOptionFlowCLIData {
  prompt: string;
  input: unknown;
  timestamp: number;
}
export type TypeOptionFlowData = IOptionFlowHeadlessData | IOptionFlowCLIData;
