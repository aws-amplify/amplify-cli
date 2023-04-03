import { GeofenceCollectionParameters } from '../service-utils/geofenceCollectionParams';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare const createGeofenceCollectionWalkthrough: (context: $TSContext, parameters: Partial<GeofenceCollectionParameters>) => Promise<Partial<GeofenceCollectionParameters>>;
export declare const geofenceCollectionNameWalkthrough: () => Promise<Pick<GeofenceCollectionParameters, 'name'>>;
export declare const geofenceCollectionAccessWalkthrough: (context: $TSContext, parameters: Partial<GeofenceCollectionParameters>) => Promise<Partial<GeofenceCollectionParameters>>;
export declare const updateGeofenceCollectionWalkthrough: (context: $TSContext, parameters: Partial<GeofenceCollectionParameters>, resourceToUpdate?: string) => Promise<Partial<GeofenceCollectionParameters>>;
export declare const updateDefaultGeofenceCollectionWalkthrough: (context: $TSContext, currentDefault: string, availableGeofenceCollections?: string[]) => Promise<string>;
//# sourceMappingURL=geofenceCollectionWalkthrough.d.ts.map