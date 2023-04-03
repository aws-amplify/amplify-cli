import { $TSAny, $TSObject } from 'amplify-cli-core';
import { LayerParameters, LayerPermission, LayerRuntime } from './layerParams';
export type LayerConfiguration = Pick<LayerParameters, 'permissions' | 'runtimes' | 'description'>;
export declare function createLayerConfiguration(layerDirPath: string, parameters: LayerConfiguration): void;
export declare function getLayerConfiguration(layerName: string): LayerConfiguration;
export declare function getLayerRuntimes(layerName: string): LayerRuntime[] | {
    value: "nodejs" | "python";
    name: "NodeJS" | "Python";
    layerExecutablePath: string;
    cloudTemplateValue: string;
}[];
export declare function saveLayerRuntimes(layerDirPath: string, runtimes?: LayerRuntime[]): void;
export declare function getLayerVersionsToBeRemovedByCfn(layerName: string, envName: string): number[];
export declare function deleteLayerVersionsToBeRemovedByCfn(layerName: string, envName: string): void;
export declare function saveLayerVersionsToBeRemovedByCfn(layerName: string, skipVersions: number[], envName: string): void;
export declare function saveLayerVersionPermissionsToBeUpdatedInCfn(layerName: string, envName: string, version: number, permissions: LayerPermission[]): void;
export declare function getLayerVersionPermissionsToBeUpdatedInCfn(layerName: string, envName: string, version: number): LayerPermission[];
export declare function deleteLayerVersionPermissionsToBeUpdatedInCfn(layerName: string, envName: string): void;
export declare function saveLayerPermissions(layerDirPath: string, permissions?: LayerPermission[]): boolean;
export declare function loadLayerParametersJson(layerName: string): $TSObject;
export declare function loadLayerConfigurationFile(layerName: string, throwIfNotExist?: boolean): any;
export declare function writeLayerConfigurationFile(layerName: string, layerConfig: $TSAny): void;
//# sourceMappingURL=layerConfiguration.d.ts.map