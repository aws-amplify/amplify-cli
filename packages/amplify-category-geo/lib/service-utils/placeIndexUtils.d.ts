import { $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
import { PlaceIndexParameters } from './placeIndexParams';
import { ResourceDependsOn } from './resourceUtils';
export declare const createPlaceIndexResource: (context: $TSContext, parameters: PlaceIndexParameters) => Promise<void>;
export declare const modifyPlaceIndexResource: (context: $TSContext, parameters: PlaceIndexParameters) => Promise<void>;
export declare const constructPlaceIndexMetaParameters: (params: PlaceIndexParameters, authResourceName: string) => PlaceIndexMetaParameters;
export type PlaceIndexMetaParameters = Pick<PlaceIndexParameters, 'isDefault' | 'accessType' | 'dataSourceIntendedUse' | 'dataProvider'> & {
    providerPlugin: string;
    service: string;
    dependsOn: ResourceDependsOn[];
};
export declare const getCurrentPlaceIndexParameters: (indexName: string) => Promise<Partial<PlaceIndexParameters>>;
export declare const getPlaceIndexIamPolicies: (resourceName: string, crudOptions: string[]) => {
    policy: $TSObject[];
    attributes: string[];
};
//# sourceMappingURL=placeIndexUtils.d.ts.map