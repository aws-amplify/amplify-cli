import { $TSContext } from 'amplify-cli-core';
import { LayerParameters } from '../utils/layerParams';
export declare function createLayerWalkthrough(context: $TSContext, parameters?: Partial<LayerParameters>): Promise<Partial<LayerParameters>>;
export declare function updateLayerWalkthrough(context: $TSContext, lambdaToUpdate?: string, parameters?: Partial<LayerParameters>): Promise<{
    parameters: Partial<LayerParameters>;
    resourceUpdated: boolean;
}>;
export declare function lambdaLayerNewVersionWalkthrough(params: LayerParameters, timestampString: string): Promise<LayerParameters>;
//# sourceMappingURL=lambdaLayerWalkthrough.d.ts.map