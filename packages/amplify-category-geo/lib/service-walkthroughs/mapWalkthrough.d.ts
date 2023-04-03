import { MapParameters } from '../service-utils/mapParams';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare const createMapWalkthrough: (context: $TSContext, parameters: Partial<MapParameters>) => Promise<Partial<MapParameters>>;
export declare const mapNameWalkthrough: () => Promise<Partial<MapParameters>>;
export declare const mapAdvancedWalkthrough: (context: $TSContext, parameters: Partial<MapParameters>) => Promise<Partial<MapParameters>>;
export declare const mapStyleWalkthrough: (parameters: Partial<MapParameters>) => Promise<Partial<MapParameters>>;
export declare const updateMapWalkthrough: (context: $TSContext, parameters: Partial<MapParameters>, resourceToUpdate?: string) => Promise<Partial<MapParameters>>;
export declare const updateDefaultMapWalkthrough: (context: $TSContext, currentDefault: string, availableMaps?: string[]) => Promise<string>;
//# sourceMappingURL=mapWalkthrough.d.ts.map