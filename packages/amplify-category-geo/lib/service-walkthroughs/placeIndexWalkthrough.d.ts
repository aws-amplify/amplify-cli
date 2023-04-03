import { PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare const createPlaceIndexWalkthrough: (context: $TSContext, parameters: Partial<PlaceIndexParameters>) => Promise<Partial<PlaceIndexParameters>>;
export declare const placeIndexNameWalkthrough: () => Promise<Partial<PlaceIndexParameters>>;
export declare const placeIndexAdvancedWalkthrough: (context: $TSContext, parameters: Partial<PlaceIndexParameters>) => Promise<Partial<PlaceIndexParameters>>;
export declare const placeIndexDataStorageWalkthrough: (parameters: Partial<PlaceIndexParameters>) => Promise<Partial<PlaceIndexParameters>>;
export declare const updatePlaceIndexWalkthrough: (context: $TSContext, parameters: Partial<PlaceIndexParameters>, resourceToUpdate?: string) => Promise<Partial<PlaceIndexParameters>>;
export declare const updateDefaultPlaceIndexWalkthrough: (context: $TSContext, currentDefault: string, availablePlaceIndices?: string[]) => Promise<string>;
//# sourceMappingURL=placeIndexWalkthrough.d.ts.map