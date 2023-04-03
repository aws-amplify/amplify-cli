import { ResourceParameters } from '../service-utils/resourceParams';
import { ServiceName } from '../service-utils/constants';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare function resourceAccessWalkthrough<T extends ResourceParameters & {
    groupPermissions: string[];
}>(context: $TSContext, parameters: Partial<T>, service: ServiceName): Promise<Partial<T>>;
export declare function dataProviderWalkthrough<T extends ResourceParameters>(parameters: Partial<T>, service: ServiceName): Promise<Partial<T>>;
export declare const getServiceFriendlyName: (service: ServiceName) => string;
export declare const defaultResourceQuestion: (service: ServiceName) => string;
//# sourceMappingURL=resourceWalkthrough.d.ts.map