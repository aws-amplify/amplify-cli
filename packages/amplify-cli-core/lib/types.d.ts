/// <reference types="node" />
import { ViewResourceTableParams } from './cliViewAPI';
import { ServiceSelection } from './serviceSelection';
import { Tag } from './tags';
import { EnvironmentInfo, InputParameters, PinpointInfo, ProjectInfo } from './exeInfo';
export type $TSAny = any;
export type $TSContext = {
    amplify: AmplifyToolkit;
    print: IContextPrint;
    migrationInfo: MigrationInfo;
    projectHasMobileHubResources: boolean;
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
export type ProjectConfig<T extends string = ''> = Pick<ProjectSettings, 'frontend' | 'version' | 'providers' | 'projectPath' | 'defaultEditor' | 'frontendHandler'> & Record<T, string>;
export type LocalEnvInfo = Required<Pick<ProjectSettings, 'projectPath' | 'defaultEditor' | 'envName' | 'noUpdateBackend'>>;
export interface FlowRecorder {
    setIsHeadless: (headless: boolean) => void;
    pushHeadlessFlow: (headlessFlowDataString: string, input: CommandLineInput) => void;
    pushInteractiveFlow: (prompt: string, input: unknown) => void;
    getFlowReport: () => IFlowReport | Record<string, never>;
    assignProjectIdentifier: (envName?: string) => string | undefined;
}
export interface IUsageData extends IUsageMetricsData, FlowRecorder {
}
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
    optionFlowData: Array<TypeOptionFlowData>;
    input: CommandLineInput;
    timestamp: string;
    projectEnvIdentifier?: string;
    projectIdentifier?: string;
}
export type TimedCodePath = ManuallyTimedCodePath | UntilExitTimedCodePath | FromStartupTimedCodePaths;
export interface IUsageMetricsData {
    emitAbort: () => Promise<void>;
    emitError: (error: Error | null) => Promise<void>;
    emitSuccess: () => Promise<void>;
    init: (installationUuid: string, version: string, input: CommandLineInput, accountId: string, projectSettings: ProjectSettings, processStartTimeStamp: number) => void;
    getUsageDataPayload: (error: Error | null, state: string) => IUsageDataPayload;
    startCodePathTimer: (codePath: StartableTimedCodePath) => void;
    stopCodePathTimer: (codePath: StoppableTimedCodePath) => void;
    calculatePushNormalizationFactor: (events: {
        StackId: string;
        PhysicalResourceId: string;
    }[], StackId: string) => void;
    getSessionUuid: () => string;
}
export type StartableTimedCodePath = ManuallyTimedCodePath | UntilExitTimedCodePath;
export type StoppableTimedCodePath = ManuallyTimedCodePath | FromStartupTimedCodePaths;
export declare enum FromStartupTimedCodePaths {
    PLATFORM_STARTUP = "platformStartup",
    TOTAL_DURATION = "totalDuration"
}
export declare enum UntilExitTimedCodePath {
    POST_PROCESS = "postProcess"
}
export declare enum ManuallyTimedCodePath {
    PLUGIN_TIME = "pluginTime",
    PUSH_TRANSFORM = "pushTransform",
    PUSH_DEPLOYMENT = "pushDeployment",
    INIT_ENV_PLATFORM = "initEnvPlatform",
    INIT_ENV_CATEGORIES = "initEnvCategories",
    PROMPT_TIME = "promptTime"
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
export type CategoryName = string;
export type ResourceName = string;
export type IContextPrint = {
    info: (message: string) => void;
    fancy: (message?: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
    success: (message: string) => void;
    table: (data: string[][], options?: {
        format?: 'markdown' | 'lean';
    }) => void;
    debug: (message: string) => void;
    green: (message: string) => void;
    yellow: (message: string) => void;
    red: (message: string) => void;
    blue: (message: string) => void;
};
export type IContextFilesystem = {
    remove: (targetPath: string) => void;
    read: (targetPath: string, encoding?: BufferEncoding) => $TSAny;
    write: (targetPath: string, data: string | NodeJS.ArrayBufferView) => void;
    exists: (targetPath: string) => boolean;
    isFile: (targetPath: string) => boolean;
    path: (...pathParts: string[]) => string;
};
export type IContextTemplate = {
    generate: (opts: {
        template: string;
        target: string;
        props: $TSObject;
        directory: string;
    }) => Promise<string>;
};
export type IPluginPlatform = {
    pluginDirectories: string[];
    pluginPrefixes: string[];
    userAddedLocations: string[];
    lastScanTime: Date;
    maxScanIntervalInSeconds: number;
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
    manifest: IPluginManifest;
};
export type DeploymentSecrets = {
    appSecrets: Array<{
        rootStackId: string;
        environments: {
            [env: string]: {
                [category: string]: {
                    [resourceName: string]: {
                        [key: string]: string;
                    };
                };
            };
        };
    }>;
};
export type GetPackageAssetPaths = () => Promise<string[]>;
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
export type $TSMeta = $TSAny;
export type $TSTeamProviderInfo = $TSAny;
export type $TSObject = Record<string, $TSAny>;
export interface ResourceTuple {
    category: string;
    resourceName: string;
}
export declare enum AmplifyFrontend {
    android = "android",
    ios = "ios",
    javascript = "javascript"
}
export interface AmplifyProjectConfig {
    projectName: string;
    version: string;
    frontend: AmplifyFrontend;
    providers: string[];
}
export interface ProviderContext {
    provider: string;
    service: string;
    projectName: string;
}
export type $TSCopyJob = $TSAny;
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
    getProjectMeta: () => $TSMeta;
    getResourceStatus: (category?: $TSAny, resourceName?: $TSAny, providerName?: $TSAny, filteredResources?: $TSAny) => $TSAny;
    getResourceOutputs: () => $TSAny;
    getWhen: () => $TSAny;
    inputValidation: (input: $TSAny) => (value: $TSAny) => boolean | string;
    listCategories: () => $TSAny;
    makeId: (n?: number) => string;
    openEditor: (context: $TSContext, target: string, waitToContinue?: boolean) => Promise<void>;
    onCategoryOutputsChange: (context: $TSContext, currentAmplifyMeta: $TSMeta | undefined, amplifyMeta?: $TSMeta) => $TSAny;
    pathManager: $TSAny;
    pressEnterToContinue: () => $TSAny;
    pushResources: (context: $TSContext, category?: string, resourceName?: string, filteredResources?: {
        category: string;
        resourceName: string;
    }[], rebuild?: boolean) => $TSAny;
    storeCurrentCloudBackend: (context: $TSContext) => $TSAny;
    readJsonFile: (fileName: string) => $TSAny;
    removeDeploymentSecrets: (context: $TSContext, category: string, resource: string) => void;
    removeResource: (context: $TSContext, category: string, resource?: string, questionOptions?: {
        headless?: boolean;
        serviceSuffix?: {
            [serviceName: string]: string;
        };
        serviceDeletionInfo?: {
            [serviceName: string]: string;
        };
    }, resourceNameCallback?: (resourceName: string) => Promise<void>) => Promise<{
        service: string;
        resourceName: string;
    } | undefined>;
    sharedQuestions: () => $TSAny;
    showAllHelp: () => $TSAny;
    showHelp: (header: string, commands: {
        name: string;
        description: string;
    }[]) => $TSAny;
    showHelpfulProviderLinks: (context: $TSContext) => $TSAny;
    showResourceTable: (category?: $TSAny, resourceName?: $TSAny, filteredResources?: $TSAny) => Promise<$TSAny>;
    showStatusTable: (resourceTableParams: ViewResourceTableParams) => Promise<$TSAny>;
    serviceSelectionPrompt: (context: $TSContext, category: string, servicesMetadata: $TSAny, customQuestion?: $TSAny, optionNameOverrides?: Record<string, string>) => Promise<ServiceSelection>;
    updateProjectConfig: () => $TSAny;
    updateamplifyMetaAfterResourceUpdate: (category: string, resourceName: string, metaResourceKey: string, metaResourceData?: $TSAny) => $TSMeta;
    updateamplifyMetaAfterResourceAdd: (category: string, resourceName: string, metaResourceData: $TSAny, backendResourceData?: $TSAny, overwriteObjectIfExists?: boolean) => void;
    updateamplifyMetaAfterResourceDelete: (category: string, resourceName: string) => void;
    updateProviderAmplifyMeta: (providerName: string, options: $TSObject) => void;
    updateamplifyMetaAfterPush: (resources: $TSObject[]) => Promise<void>;
    updateamplifyMetaAfterBuild: (resource: ResourceTuple, buildType?: string) => void;
    updateAmplifyMetaAfterPackage: (resource: ResourceTuple, zipFilename: string, hash?: {
        resourceKey: string;
        hashValue: string;
    }) => void;
    updateBackendConfigAfterResourceAdd: (category: string, resourceName: string, resourceData: $TSObject) => void;
    updateBackendConfigAfterResourceUpdate: (category: string, resourceName: string, attribute: string, value: $TSAny) => void;
    updateBackendConfigAfterResourceRemove: (category: string, resourceName: string) => void;
    loadEnvResourceParameters: (context: $TSContext, category: string, resourceName: string) => $TSAny;
    saveEnvResourceParameters: (context: $TSContext | undefined, category: string, resourceName: string, envSpecificParams?: $TSObject) => void;
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
export {};
//# sourceMappingURL=types.d.ts.map