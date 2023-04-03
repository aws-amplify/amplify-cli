import { $TSContext } from 'amplify-cli-core';
export declare function getAuthResourceARN(context: $TSContext): Promise<string>;
export declare function migrateAuthDependencyResource(context: $TSContext): Promise<boolean>;
export declare function checkStorageAuthenticationRequirements(context: $TSContext, storageResourceName: string, allowUnauthenticatedIdentities: boolean): Promise<void>;
//# sourceMappingURL=s3-auth-api.d.ts.map