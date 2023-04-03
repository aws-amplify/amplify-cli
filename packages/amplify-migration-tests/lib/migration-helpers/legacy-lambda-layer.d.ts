import { LayerPermissionChoice, LayerRuntime } from '@aws-amplify/amplify-e2e-core';
export declare function legacyAddLayer(cwd: string, settings: {
    layerName: string;
    permissions?: LayerPermissionChoice[];
    accountId?: string;
    orgId?: string;
    runtimes: LayerRuntime[];
}): Promise<void>;
export declare function legacyAddOptData(projRoot: string, layerName: string): void;
export declare function legacyUpdateOptData(projRoot: string, layerName: string, data: string): void;
export declare function validateLayerConfigFilesMigrated(projRoot: string, layerName: string): boolean;
