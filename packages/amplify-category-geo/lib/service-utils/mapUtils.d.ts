import { $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
import { MapParameters } from './mapParams';
import { ResourceDependsOn } from './resourceUtils';
export declare const createMapResource: (context: $TSContext, parameters: MapParameters) => Promise<void>;
export declare const modifyMapResource: (context: $TSContext, parameters: MapParameters) => Promise<void>;
export declare const constructMapMetaParameters: (params: MapParameters, authResourceName: string) => MapMetaParameters;
export type MapMetaParameters = Pick<MapParameters, 'isDefault' | 'accessType'> & {
    providerPlugin: string;
    service: string;
    mapStyle: string;
    dependsOn: ResourceDependsOn[];
};
export declare const getCurrentMapParameters: (mapName: string) => Promise<Partial<MapParameters>>;
export declare const getMapFriendlyNames: (mapNames: string[]) => Promise<string[]>;
export declare const getMapIamPolicies: (resourceName: string, crudOptions: string[]) => {
    policy: $TSObject[];
    attributes: string[];
};
//# sourceMappingURL=mapUtils.d.ts.map