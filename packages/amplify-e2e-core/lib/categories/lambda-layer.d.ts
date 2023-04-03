import { $TSMeta } from 'amplify-cli-core';
/**
 * valid layer runtime choices
 */
export type LayerRuntime = 'nodejs' | 'python';
type LayerRuntimeDisplayName = 'NodeJS' | 'Python';
/**
 * valid layer permission choices
 */
export type LayerPermissionChoice = 'Specific AWS accounts' | 'Specific AWS organization' | 'Public (Anyone on AWS can use this layer)';
export declare const layerRuntimeChoices: LayerRuntimeDisplayName[];
export declare const permissionChoices: LayerPermissionChoice[];
/**
 * helper type for constructing the layer resource's path
 */
export type LayerDirectoryType = {
    layerName: string;
    projName: string;
};
/**
 * validate layer directory
 */
export declare const validateLayerDir: (projectRoot: string, layerProjectName: LayerDirectoryType, runtimes: LayerRuntime[]) => boolean;
/**
 * get the name of a layer directory
 */
export declare const getLayerDirectoryName: ({ layerName, projName }: {
    layerName: string;
    projName: string;
}) => string;
/**
 * validation helper for layer version
 */
export declare const validatePushedVersion: (projectRoot: string, layerProjectName: LayerDirectoryType, permissions: LayerPermission[]) => void;
/**
 * validation helper for ephemeral layer version permissions
 */
export declare const expectEphemeralPermissions: (projectRoot: string, layerProjectName: LayerDirectoryType, envName: string, version: number, permissions: LayerPermission[]) => void;
/**
 * validation helper for ephemeral data
 */
export declare const expectEphemeralDataIsUndefined: (projectRoot: string, layerProjectName: LayerDirectoryType) => void;
/**
 * validation helper for layer version description
 */
export declare const expectDeployedLayerDescription: (projectRoot: string, layerProjectName: LayerDirectoryType, meta: $TSMeta, envName: string, layerDescription: string) => Promise<void>;
/**
 * validation helper for Lambda layers
 */
export declare const validateLayerMetadata: (projectRoot: string, layerProjectName: LayerDirectoryType, meta: $TSMeta, envName: string, arns: string[]) => Promise<void>;
/**
 * get arn from amplify-meta.json
 */
export declare const getCurrentLayerArnFromMeta: (projectRoot: string, layerProjectName: LayerDirectoryType) => string;
/**
 * add a Lambda layer resource via `amplify add function`
 */
export declare const addLayer: (cwd: string, settings: {
    layerName: string;
    permissions?: LayerPermissionChoice[];
    accountId?: string;
    orgId?: string;
    projName: string;
    runtimes: LayerRuntime[];
}, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * Remove all layer versions via `amplify remove function`
 * Assumes first item in list of functions is a layer and removes it
 */
export declare const removeLayer: (cwd: string, versionsToRemove: number[], allVersions: number[]) => Promise<void>;
/**
 * remove layer version via `amplify remove function`
 * assumes first item in list of functions is a layer and removes it
 */
export declare const removeLayerVersion: (cwd: string, settings: {
    removeLegacyOnly?: boolean;
    removeNoLayerVersions?: boolean;
}, versionsToRemove: number[], allVersions: number[], testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * update Lambda layer resource via `amplify update function`
 */
export declare const updateLayer: (cwd: string, settings?: {
    layerName?: string;
    projName?: string;
    runtimes?: string[];
    numLayers?: number;
    versions?: number;
    permissions?: string[];
    dontChangePermissions?: boolean;
    changePermissionOnFutureVersion?: boolean;
    changePermissionOnLatestVersion?: boolean;
    migrateLegacyLayer?: boolean;
}, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * append passed in data to opt/data.txt for the given Lambda layer resource
 */
export declare const updateOptData: (projectRoot: string, layerProjectName: LayerDirectoryType, data: string) => void;
/**
 * write passed in data to opt/data.txt for the given Lambda layer resource
 */
export declare const addOptData: (projectRoot: string, layerProjectName: LayerDirectoryType, data?: string) => void;
/**
 * layer permission enum
 */
export declare enum LayerPermissionName {
    awsAccounts = "awsAccounts",
    awsOrg = "awsOrg",
    private = "Private",
    public = "Public"
}
/**
 * layer permission interface
 */
export interface LayerPermission {
    type: LayerPermissionName;
    accounts?: string[];
    orgs?: string[];
}
/**
 * get Lambda layer version arn from the local CloudFormation template
 */
export declare const getLayerVersionArnFromCfn: (projectRoot: string, layerProjectName: LayerDirectoryType) => string[];
/**
 * map display names for runtimes
 */
export declare const getRuntimeDisplayNames: (runtimes: LayerRuntime[]) => string[];
export {};
