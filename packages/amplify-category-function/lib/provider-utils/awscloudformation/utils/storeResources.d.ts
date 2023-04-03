import { $TSContext, $TSObject } from 'amplify-cli-core';
import { FunctionParameters, FunctionTriggerParameters } from '@aws-amplify/amplify-function-plugin-interface';
import { LayerParameters } from './layerParams';
export declare const createFunctionResources: (context: $TSContext, parameters: FunctionParameters | FunctionTriggerParameters) => Promise<void>;
export declare const createLayerArtifacts: (context: $TSContext, parameters: LayerParameters) => string;
declare const defaultOpts: {
    updateLayerParams: boolean;
    generateCfnFile: boolean;
    updateMeta: boolean;
    updateDescription: boolean;
};
export declare const updateLayerArtifacts: (context: $TSContext, parameters: LayerParameters, options?: Partial<typeof defaultOpts>) => Promise<boolean>;
export declare const saveMutableState: (context: $TSContext, parameters: Partial<Pick<FunctionParameters, 'mutableParametersState' | 'resourceName' | 'lambdaLayers' | 'functionName' | 'secretDeltas' | 'environmentVariables'>> | FunctionTriggerParameters) => Promise<void>;
export declare const saveCFNParameters: (parameters: Partial<Pick<FunctionParameters, 'cloudwatchRule' | 'resourceName'>> | FunctionTriggerParameters) => void;
export declare const ensureLayerFolders: (parameters: LayerParameters) => string;
export declare const createParametersFile: (parameters: $TSObject, resourceName: string, paramFileName: string) => void;
export {};
//# sourceMappingURL=storeResources.d.ts.map