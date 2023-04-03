import { $TSContext } from 'amplify-cli-core';
export declare const enum LegacyState {
    NOT_LEGACY = 0,
    MULTI_ENV_LEGACY = 1,
    SINGLE_ENV_LEGACY = 2
}
export declare const enum LegacyPermissionEnum {
    AwsAccounts = "awsAccounts",
    AwsOrg = "awsOrg",
    Private = "private",
    Public = "public"
}
export type LegacyPermission = {
    type: LegacyPermissionEnum;
    accounts?: string[];
    orgs?: string[];
};
type LegacyRuntime = {
    value: 'nodejs' | 'python';
    name: 'NodeJS' | 'Python';
    layerExecutablePath: string;
    cloudTemplateValue: string;
};
export declare const migrateLegacyLayer: (context: $TSContext, layerName: string) => Promise<boolean>;
export declare const getLegacyLayerState: (layerName: string) => LegacyState;
export declare const readLegacyRuntimes: (layerName: string, legacyState: LegacyState) => LegacyRuntime[];
export {};
//# sourceMappingURL=layerMigrationUtils.d.ts.map