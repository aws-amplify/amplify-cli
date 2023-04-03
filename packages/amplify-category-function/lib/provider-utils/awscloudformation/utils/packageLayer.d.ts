import { $TSAny, $TSContext } from 'amplify-cli-core';
import { Packager } from '../types/packaging-types';
export declare const packageLayer: Packager;
export declare function checkContentChanges(context: $TSContext, layerResources: Array<$TSAny>): Promise<void>;
export declare function createLayerZipFilename(resourceName: string, latestLayerVersionLogicalId: string): string;
//# sourceMappingURL=packageLayer.d.ts.map