import { $TSObject, $TSContext } from '@aws-amplify/amplify-cli-core';
import { BaseStack } from '../service-stacks/baseStack';
import { ServiceName } from './constants';
import { ResourceParameters } from './resourceParams';
export declare function merge<T>(existing: Partial<T>, other?: Partial<T>): Partial<T>;
export declare const generateTemplateFile: (stack: BaseStack, resourceName: string) => void;
export declare const updateParametersFile: (parameters: $TSObject, resourceName: string, parametersFileName: string) => void;
export declare const getGeoServiceMeta: (service: ServiceName) => Promise<$TSObject>;
export declare const readResourceMetaParameters: (service: ServiceName, resourceName: string) => Promise<$TSObject>;
export declare const updateDefaultResource: (context: $TSContext, service: ServiceName, defaultResource?: string) => Promise<void>;
export declare const geoServiceExists: (service: ServiceName) => Promise<boolean>;
export declare const checkAuthConfig: (context: $TSContext, parameters: Pick<ResourceParameters, 'name' | 'accessType'>, service: ServiceName) => Promise<void>;
export declare const checkGeoResourceExists: (resourceName: string) => Promise<boolean>;
export declare const getServicePermissionPolicies: (context: $TSContext, service: ServiceName, resourceName: string, crudOptions: string[]) => {
    policy: $TSObject[];
    attributes: string[];
};
export declare const checkAnyGeoResourceExists: () => Promise<boolean>;
export declare const getAuthResourceName: () => Promise<string>;
export type ResourceDependsOn = {
    category: string;
    resourceName: string;
    attributes: string[];
};
export declare const getResourceDependencies: (groupNames: string[], authResourceName: string) => ResourceDependsOn[];
export declare const getGeoResources: (service: ServiceName) => Promise<string[]>;
//# sourceMappingURL=resourceUtils.d.ts.map