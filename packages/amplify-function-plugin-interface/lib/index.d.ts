export type FunctionRuntimeContributorFactory = (context: any) => Contributor<FunctionRuntimeParameters, RuntimeContributionRequest> & FunctionRuntimeLifecycleManager;
export type FunctionRuntimeParameters = Pick<FunctionParameters, 'runtime'>;
export type FunctionTemplateContributorFactory = (context: any) => Contributor<Partial<FunctionParameters>, TemplateContributionRequest>;
export type FunctionTemplateParameters = Pick<FunctionParameters, 'dependsOn' | 'functionTemplate' | 'triggerEventSourceMappings'>;
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
export type InvocationRequest = {
    srcRoot: string;
    runtime: string;
    handler: string;
    event: string;
    envVars?: {
        [key: string]: string;
    };
};
export type BuildRequest = {
    buildType: BuildType;
    srcRoot: string;
    runtime: string;
    legacyBuildHookParams?: {
        projectRoot: string;
        resourceName: string;
    };
    lastBuildTimeStamp?: Date;
    lastBuildType?: BuildType;
    service?: string;
};
export declare enum BuildType {
    PROD = "PROD",
    DEV = "DEV"
}
export type PackageRequest = {
    env: string;
    srcRoot: string;
    dstFilename: string;
    runtime: string;
    lastBuildTimeStamp: Date;
    lastPackageTimeStamp?: Date;
    skipHashing?: boolean;
    service?: string;
    currentHash?: boolean;
};
export type BuildResult = {
    rebuilt: boolean;
};
export type PackageResult = {
    packageHash?: string;
    zipEntries?: ZipEntry[];
};
export type ZipEntry = {
    sourceFolder?: string;
    packageFolder?: string;
    ignoreFiles?: string[];
};
export type CheckDependenciesResult = {
    hasRequiredDependencies: boolean;
    errorMessage?: string;
};
export type FunctionParameters = {
    providerContext: ProviderContext;
    cloudResourceTemplatePath: string;
    resourceName: string;
    functionName: string;
    runtime: FunctionRuntime;
    roleName: string;
    dependsOn?: FunctionDependency[];
    functionTemplate?: FunctionTemplate;
    categoryPolicies?: object[];
    skipEdit?: boolean;
    mutableParametersState?: any;
    environmentMap?: Record<string, any>;
    triggerEventSourceMappings?: any;
    topLevelComment?: string;
    runtimePluginId: string;
    cloudwatchRule?: string;
    lambdaLayers: LambdaLayer[];
    environmentVariables?: Record<string, string>;
    secretDeltas?: SecretDeltas;
    template?: string;
    defaultRuntime?: string;
    skipAdvancedSection?: boolean;
    skipNextSteps?: boolean;
};
export interface FunctionTriggerParameters {
    trigger: boolean;
    key: string;
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
    environmentVariables?: Record<string, string>;
    skipNextSteps?: boolean;
}
export interface ProviderContext {
    provider: string;
    service: string;
    projectName: string;
}
export interface FunctionRuntime {
    name: string;
    value: string;
    cloudTemplateValue: string;
    defaultHandler: string;
    layerExecutablePath?: string;
    layerDefaultFiles?: LayerFiles[];
    runtimePluginId?: string;
}
export interface LayerFiles {
    path: string;
    filename: string;
    content?: any;
}
export interface FunctionTemplate {
    handler?: string;
    parameters?: any;
    sourceRoot: string;
    sourceFiles: string[];
    destMap?: {
        [name: string]: string;
    };
    defaultEditorFile?: string;
}
export interface FunctionDependency {
    category: string;
    resourceName: string;
    attributes: string[];
    attributeEnvMap?: {
        [name: string]: string;
    };
}
export type LambdaLayer = ProjectLayer | ExternalLayer;
export interface ProjectLayer {
    type: 'ProjectLayer';
    resourceName: string;
    version: number | string;
    isLatestVersionSelected: boolean;
    env: string;
}
export interface ExternalLayer {
    type: 'ExternalLayer';
    arn: string | {
        'Fn::Sub': string;
    } | {
        Ref: string;
    };
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
export type SecretDeltas = Record<SecretName, SecretDelta>;
export type SecretName = string;
export type SecretDelta = RetainSecret | RemoveSecret | SetSecret;
export type RetainSecret = {
    operation: 'retain';
};
export declare const retainSecret: RetainSecret;
export type RemoveSecret = {
    operation: 'remove';
};
export declare const removeSecret: RemoveSecret;
export type SetSecret = {
    operation: 'set';
    value: string;
};
export declare const setSecret: (value: string) => SetSecret;
export {};
//# sourceMappingURL=index.d.ts.map