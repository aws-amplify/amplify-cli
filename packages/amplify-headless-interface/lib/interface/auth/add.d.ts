export interface AddAuthRequest {
    version: 2;
    resourceName: string;
    serviceConfiguration: CognitoServiceConfiguration;
}
export type CognitoServiceConfiguration = BaseCognitoServiceConfiguration & (NoCognitoIdentityPool | CognitoIdentityPool);
export interface BaseCognitoServiceConfiguration {
    serviceName: 'Cognito';
    userPoolConfiguration: CognitoUserPoolConfiguration;
}
export interface NoCognitoIdentityPool {
    includeIdentityPool: false;
}
export interface CognitoIdentityPool {
    includeIdentityPool: true;
    identityPoolConfiguration?: CognitoIdentityPoolConfiguration;
}
export interface CognitoIdentityPoolConfiguration {
    identityPoolName?: string;
    unauthenticatedLogin?: boolean;
    identitySocialFederation?: CognitoIdentitySocialFederation[];
}
export interface CognitoIdentitySocialFederation {
    provider: 'FACEBOOK' | 'GOOGLE' | 'AMAZON' | 'APPLE';
    clientId: string;
}
export interface CognitoUserPoolConfiguration {
    signinMethod: CognitoUserPoolSigninMethod;
    requiredSignupAttributes: CognitoUserProperty[];
    aliasAttributes?: CognitoUserAliasAttributes[];
    userPoolName?: string;
    userPoolGroups?: CognitoUserPoolGroup[];
    adminQueries?: CognitoAdminQueries;
    mfa?: CognitoMFAConfiguration;
    passwordPolicy?: CognitoPasswordPolicy;
    refreshTokenPeriod?: number;
    readAttributes?: (CognitoUserProperty | CognitoUserPropertyVerified)[];
    writeAttributes?: CognitoUserProperty[];
    oAuth?: CognitoOAuthConfiguration;
    autoVerifiedAttributes?: CognitoAutoVerifiedAttributesConfiguration;
}
export type CognitoAutoVerifiedAttributesConfiguration = Array<CognitoAutoVerifyEmailConfiguration | CognitoAutoVerifyPhoneNumberConfiguration>;
export interface CognitoAutoVerifyPhoneNumberConfiguration {
    type: 'PHONE_NUMBER';
    verificationMessage?: string;
}
export interface CognitoAutoVerifyEmailConfiguration {
    type: 'EMAIL';
    verificationMessage?: string;
    verificationSubject?: string;
}
export interface CognitoOAuthConfiguration {
    domainPrefix?: string;
    redirectSigninURIs: string[];
    redirectSignoutURIs: string[];
    oAuthGrantType: 'CODE' | 'IMPLICIT';
    oAuthScopes: ('PHONE' | 'EMAIL' | 'OPENID' | 'PROFILE' | 'AWS.COGNITO.SIGNIN.USER.ADMIN')[];
    socialProviderConfigurations?: CognitoSocialProviderConfiguration[];
}
interface SocialProviderConfig {
    provider: 'FACEBOOK' | 'GOOGLE' | 'LOGIN_WITH_AMAZON';
    clientId: string;
    clientSecret: string;
}
interface SignInWithAppleSocialProviderConfig {
    provider: 'SIGN_IN_WITH_APPLE';
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey?: string;
}
export type CognitoSocialProviderConfiguration = SocialProviderConfig | SignInWithAppleSocialProviderConfig;
export interface CognitoPasswordPolicy {
    minimumLength?: number;
    additionalConstraints?: CognitoPasswordConstraint[];
}
export type CognitoMFAConfiguration = CognitoMFAOff | CognitoMFASettings;
export interface CognitoMFAOff {
    mode: 'OFF';
}
export interface CognitoMFASettings {
    mode: 'ON' | 'OPTIONAL';
    mfaTypes: ('SMS' | 'TOTP')[];
    smsMessage: string;
}
export interface CognitoAdminQueries {
    permissions: {
        restrictAccess: boolean;
        groupName?: string;
    };
}
export interface CognitoUserPoolGroup {
    customPolicy?: string;
    groupName: string;
}
export declare enum CognitoPasswordConstraint {
    REQUIRE_LOWERCASE = "REQUIRE_LOWERCASE",
    REQUIRE_UPPERCASE = "REQUIRE_UPPERCASE",
    REQUIRE_DIGIT = "REQUIRE_DIGIT",
    REQUIRE_SYMBOL = "REQUIRE_SYMBOL"
}
export declare enum CognitoUserPoolSigninMethod {
    USERNAME = "USERNAME",
    EMAIL = "EMAIL",
    PHONE_NUMBER = "PHONE_NUMBER",
    EMAIL_AND_PHONE_NUMBER = "EMAIL_AND_PHONE_NUMBER"
}
export declare enum CognitoUserAliasAttributes {
    PREFERRED_USERNAME = "PREFERRED_USERNAME",
    EMAIL = "EMAIL",
    PHONE_NUMBER = "PHONE_NUMBER"
}
export declare enum CognitoUserProperty {
    ADDRESS = "ADDRESS",
    BIRTHDATE = "BIRTHDATE",
    EMAIL = "EMAIL",
    FAMILY_NAME = "FAMILY_NAME",
    MIDDLE_NAME = "MIDDLE_NAME",
    GENDER = "GENDER",
    LOCALE = "LOCALE",
    GIVEN_NAME = "GIVEN_NAME",
    NAME = "NAME",
    NICKNAME = "NICKNAME",
    PHONE_NUMBER = "PHONE_NUMBER",
    PREFERRED_USERNAME = "PREFERRED_USERNAME",
    PICTURE = "PICTURE",
    PROFILE = "PROFILE",
    UPDATED_AT = "UPDATED_AT",
    WEBSITE = "WEBSITE",
    ZONE_INFO = "ZONE_INFO"
}
export declare enum CognitoUserPropertyVerified {
    EMAIL_VERIFIED = "EMAIL_VERIFIED",
    PHONE_NUMBER_VERIFIED = "PHONE_NUMBER_VERIFIED"
}
export {};
//# sourceMappingURL=add.d.ts.map