import { ResourceParameters } from './resourceParams';
export type GeofenceCollectionParameters = ResourceParameters & {
    groupPermissions: Record<string, string[]>;
};
export declare const isCompleteGeofenceCollectionParams: (partial: Partial<GeofenceCollectionParameters>) => partial is GeofenceCollectionParameters;
export declare const convertToCompleteGeofenceCollectionParams: (partial: Partial<GeofenceCollectionParameters>) => GeofenceCollectionParameters;
//# sourceMappingURL=geofenceCollectionParams.d.ts.map