import { $TSAny, $TSContext, $TSMeta } from 'amplify-cli-core';
export { importResource } from './import';
export declare const addResource: (context: $TSContext, category: string, service: string, options: $TSAny) => Promise<any>;
export declare const updateResource: (context: $TSContext, category: string, service: string) => Promise<any>;
export declare const migrateResource: (context: $TSContext, projectPath: string, service: string, resourceName: string) => Promise<any>;
export declare const getPermissionPolicies: (service: string, resourceName: string, crudOptions: $TSAny) => Promise<any>;
export declare const updateConfigOnEnvInit: (context: $TSContext, category: string, resourceName: string, service: string) => Promise<import("./import/types").S3EnvSpecificResourceParameters | import("./import/types").DynamoDBEnvSpecificResourceParameters | undefined>;
export declare const console: (amplifyMeta: $TSMeta, provider: string, service: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map