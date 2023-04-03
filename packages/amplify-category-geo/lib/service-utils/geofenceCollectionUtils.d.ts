import { $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
import { GeofenceCollectionParameters } from './geofenceCollectionParams';
import { ResourceDependsOn } from './resourceUtils';
export declare const createGeofenceCollectionResource: (context: $TSContext, parameters: GeofenceCollectionParameters) => Promise<void>;
export declare const modifyGeofenceCollectionResource: (context: $TSContext, parameters: GeofenceCollectionParameters) => Promise<void>;
export declare const constructGeofenceCollectionMetaParameters: (params: GeofenceCollectionParameters, authResourceName: string) => GeofenceCollectionMetaParameters;
export type GeofenceCollectionMetaParameters = Pick<GeofenceCollectionParameters, 'isDefault' | 'accessType'> & {
    providerPlugin: string;
    service: string;
    dependsOn: ResourceDependsOn[];
};
export declare const getCurrentGeofenceCollectionParameters: (collectionName: string) => Promise<Partial<GeofenceCollectionParameters>>;
export declare const getGeofenceCollectionIamPolicies: (resourceName: string, crudOptions: string[]) => {
    policy: $TSObject[];
    attributes: string[];
};
export declare const crudPermissionsMap: Record<string, string[]>;
//# sourceMappingURL=geofenceCollectionUtils.d.ts.map