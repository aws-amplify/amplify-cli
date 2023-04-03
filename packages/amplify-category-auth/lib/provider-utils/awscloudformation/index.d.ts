import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AuthContext } from '../../context';
export { importResource } from './import';
export declare const addResource: (context: AuthContext, service: string) => Promise<string>;
export declare const updateResource: (context: AuthContext, { service }: {
    service: any;
}) => Promise<any>;
export declare const updateConfigOnEnvInit: (context: $TSContext, category: any, service: string) => Promise<any>;
export declare const migrate: (context: $TSContext) => Promise<void>;
export declare const console: (context: $TSContext, amplifyMeta: any) => Promise<any>;
export declare const getPermissionPolicies: (context: $TSContext, service: string, resourceName: string, crudOptions: any) => any;
//# sourceMappingURL=index.d.ts.map