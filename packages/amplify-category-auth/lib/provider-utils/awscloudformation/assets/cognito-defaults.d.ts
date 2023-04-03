export function getAllDefaults(name: any): any;
export namespace functionMap {
    export { userPoolDefaults as userPoolOnly };
    export { identityAndUserPoolDefaults as identityPoolAndUserPool };
    export { identityPoolDefaults as identityPoolOnly };
}
export function generalDefaults(projectName: any): {
    sharedId: string;
    resourceName: string;
    resourceNameTruncated: string;
    authSelections: string;
};
export function withSocialDefaults(projectName: any): {
    hostedUI: boolean;
    hostedUIDomainName: string;
    AllowedOAuthFlows: string[];
    AllowedOAuthScopes: string[];
};
export namespace entityKeys {
    const identityPoolKeys: string[];
    const userPoolKeys: string[];
}
export const sharedId: string;
declare function userPoolDefaults(projectName: any): {
    resourceNameTruncated: string;
    userPoolName: string;
    autoVerifiedAttributes: string[];
    mfaConfiguration: string;
    mfaTypes: string[];
    smsAuthenticationMessage: string;
    smsVerificationMessage: string;
    emailVerificationSubject: string;
    emailVerificationMessage: string;
    defaultPasswordPolicy: boolean;
    passwordPolicyMinLength: number;
    passwordPolicyCharacters: never[];
    requiredAttributes: string[];
    aliasAttributes: never[];
    userpoolClientGenerateSecret: boolean;
    userpoolClientRefreshTokenValidity: number;
    userpoolClientWriteAttributes: string[];
    userpoolClientReadAttributes: string[];
    userpoolClientLambdaRole: string;
    userpoolClientSetAttributes: boolean;
};
declare function identityAndUserPoolDefaults(projectName: any): {
    resourceNameTruncated: string;
    userPoolName: string;
    autoVerifiedAttributes: string[];
    mfaConfiguration: string;
    mfaTypes: string[];
    smsAuthenticationMessage: string;
    smsVerificationMessage: string;
    emailVerificationSubject: string;
    emailVerificationMessage: string;
    defaultPasswordPolicy: boolean;
    passwordPolicyMinLength: number;
    passwordPolicyCharacters: never[];
    requiredAttributes: string[];
    aliasAttributes: never[];
    userpoolClientGenerateSecret: boolean;
    userpoolClientRefreshTokenValidity: number;
    userpoolClientWriteAttributes: string[];
    userpoolClientReadAttributes: string[];
    userpoolClientLambdaRole: string;
    userpoolClientSetAttributes: boolean;
    identityPoolName: string;
    allowUnauthenticatedIdentities: boolean;
};
declare function identityPoolDefaults(projectName: any): {
    identityPoolName: string;
    allowUnauthenticatedIdentities: boolean;
};
export {};
//# sourceMappingURL=cognito-defaults.d.ts.map