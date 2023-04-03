export type AddAuthUserPoolOnlyNoOAuthSettings = {
    resourceName: string;
    userPoolName: string;
};
export type AddAuthUserPoolOnlyWithOAuthSettings = AddAuthUserPoolOnlyNoOAuthSettings & {
    domainPrefix: string;
    signInUrl1: string;
    signInUrl2: string;
    signOutUrl1: string;
    signOutUrl2: string;
    facebookAppId: string;
    facebookAppSecret: string;
    googleAppId: string;
    googleAppSecret: string;
    amazonAppId: string;
    amazonAppSecret: string;
    appleAppClientId: string;
    appleAppTeamId: string;
    appleAppKeyID: string;
    appleAppPrivateKey: string;
};
export type AddAuthIdentityPoolAndUserPoolWithOAuthSettings = AddAuthUserPoolOnlyWithOAuthSettings & {
    identityPoolName: string;
    allowUnauthenticatedIdentities: boolean;
    idpFacebookAppId: string;
    idpGoogleAppId: string;
    idpAmazonAppId: string;
    idpAppleAppId: string;
};
export declare const addAuthWithDefault: (cwd: string, testingWithLatestCodebase?: boolean) => Promise<void>;
export declare function runAmplifyAuthConsole(cwd: string): Promise<void>;
export declare function removeAuthWithDefault(cwd: string, testingWithLatestCodebase?: boolean): Promise<void>;
export declare function addAuthWithGroupTrigger(cwd: string): Promise<void>;
export declare function addAuthWithEmailVerificationAndUserPoolGroupTriggers(cwd: string): Promise<void>;
interface AddApiOptions {
    apiName: string;
    testingWithLatestCodebase: boolean;
    transformerVersion: number;
}
export declare function addAuthViaAPIWithTrigger(cwd: string, opts?: Partial<AddApiOptions>): Promise<void>;
export declare function addAuthwithUserPoolGroupsViaAPIWithTrigger(cwd: string, opts?: Partial<AddApiOptions>): Promise<void>;
export declare function addAuthWithCustomTrigger(cwd: string, settings: any): Promise<void>;
export declare function updateAuthSignInSignOutUrl(cwd: string, settings: any): Promise<void>;
export declare function updateAuthToRemoveFederation(cwd: string, settings: any): Promise<void>;
export declare function updateAuthWithoutCustomTrigger(cwd: string, settings: any): Promise<void>;
export declare function addAuthWithRecaptchaTrigger(cwd: string): Promise<void>;
export declare function updateAuthRemoveRecaptchaTrigger(cwd: string, settings: any): Promise<void>;
export declare function addAuthWithSignInSignOutUrl(cwd: string, settings: any): Promise<void>;
export declare function addAuthWithDefaultSocial_v4_30(cwd: string): Promise<void>;
export declare function addAuthWithDefaultSocial(cwd: string): Promise<void>;
export declare function addAuthUserPoolOnly(cwd: string): Promise<void>;
export declare function addAuthWithGroups(cwd: string): Promise<void>;
export declare function addAuthWithGroupsAndAdminAPI(cwd: string): Promise<void>;
export declare function addAuthWithMaxOptions(cwd: string, settings: any): Promise<void>;
export declare function addAuthWithPreTokenGenerationTrigger(projectDir: string): Promise<void>;
export declare function updateAuthAddUserGroups(projectDir: string, groupNames: string[], settings?: any): Promise<void>;
export declare function addAuthUserPoolOnlyWithOAuth(cwd: string, settings: AddAuthUserPoolOnlyWithOAuthSettings): Promise<void>;
export declare function addAuthIdentityPoolAndUserPoolWithOAuth(cwd: string, settings: AddAuthIdentityPoolAndUserPoolWithOAuthSettings): Promise<void>;
export declare function addAuthUserPoolOnlyNoOAuth(cwd: string, settings: AddAuthUserPoolOnlyNoOAuthSettings): Promise<void>;
export declare function updateAuthAddAdminQueries(projectDir: string, groupName?: string, settings?: any): Promise<void>;
export declare function updateAuthWithoutTrigger(cwd: string, settings: any): Promise<void>;
export declare function updateAuthAdminQueriesWithExtMigration(cwd: string, settings: {
    testingWithLatestCodebase: boolean;
}): Promise<void>;
export declare function updateAuthMFAConfiguration(projectDir: string, settings?: any): Promise<void>;
export declare function updateAuthWithGroupTrigger(cwd: string): Promise<void>;
export {};
