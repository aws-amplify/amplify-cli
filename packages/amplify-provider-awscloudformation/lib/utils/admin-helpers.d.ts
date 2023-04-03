import { $TSContext } from 'amplify-cli-core';
import { AwsSdkConfig } from './auth-types';
export declare const adminVerifyUrl: (appId: string, envName: string, region: string) => string;
export declare function doAdminTokensExist(appId: string): boolean;
export declare function isAmplifyAdminApp(appId: string): Promise<{
    isAdminApp: boolean;
    region: string;
    userPoolID: string;
}>;
export declare function getTempCredsWithAdminTokens(context: $TSContext, appId: string): Promise<AwsSdkConfig>;
export declare const adminBackendMap: {
    [region: string]: {
        amplifyAdminUrl: string;
        appStateUrl: string;
    };
};
//# sourceMappingURL=admin-helpers.d.ts.map