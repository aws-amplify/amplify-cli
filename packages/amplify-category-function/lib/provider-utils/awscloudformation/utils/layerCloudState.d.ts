import { $TSContext } from 'amplify-cli-core';
import { LayerVersionMetadata } from './layerParams';
export declare class LayerCloudState {
    private static instances;
    private layerVersionsMetadata;
    latestVersionLogicalId: string;
    private constructor();
    static getInstance(layerName: string): LayerCloudState;
    private loadLayerDataFromCloud;
    getLayerVersionsFromCloud(context: $TSContext, layerName: string): Promise<LayerVersionMetadata[]>;
}
//# sourceMappingURL=layerCloudState.d.ts.map