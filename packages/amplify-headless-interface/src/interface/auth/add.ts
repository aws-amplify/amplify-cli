/**
 * Defines acceptable payloads to amplify add auth --headless.
 */
export interface AddAuthRequest {
  /**
   * The schema version.
   */
  version: 1;
  /**
   * A name for the auth resource.
   */
  resourceName: string;
  /**
   * The configuration that defines the auth resource.
   */
  serviceConfiguration: CognitoServiceConfiguration;
}

/**
 * Defines AWS Cognito parameters.
 */
export type CognitoServiceConfiguration = BaseCognitoServiceConfiguration & (NoCognitoIdentityPool | CognitoIdentityPool);

/**
 * Configuration that applies to all Cognito configuration.
 */
export interface BaseCognitoServiceConfiguration {
  /**
   * The name of the service providing the resource.
   */
  serviceName: 'Cognito';
  /**
   * The Cognito user pool configuration.
   */
  userPoolConfiguration: CognitoUserPoolConfiguration;
}

/**
 * Specifies that the Cognito configuration should not include an identity pool.
 */
export interface NoCognitoIdentityPool {
  /**
   * Indicates an indentity pool should not be configured.
   */
  includeIdentityPool: false;
}

/**
 * Specifies that the Cognito configuration includes an identity pool configuration.
 */
export interface CognitoIdentityPool {
  /**
   * Indicates an identity pool should be configured.
   */
  includeIdentityPool: true;
  /**
   * The identity pool configuration. If not specified, defaults are applied.
   */
  identityPoolConfiguration?: CognitoIdentityPoolConfiguration;
}

export interface CognitoIdentityPoolConfiguration {
  /**
   * If not specified, a random string is generated.
   */
  identityPoolName?: string;
  /**
   * Allow guest login or not. Default is false.
   */
  unauthenticatedLogin?: boolean;
  /**
   * If specified, Cognito will allow the specified providers to federate into the IdentityPool.
   */
  identitySocialFederation?: CognitoIdentitySocialFederation[];
}

/**
 * Defines a social federation provider.
 */
export interface CognitoIdentitySocialFederation {
  provider: 'FACEBOOK' | 'GOOGLE' | 'AMAZON' | 'APPLE';
  /**
   * ClientId unique to your client and the provider.
   */
  clientId: string;
}

/**
 * Cognito configuration exposed by Amplify.
 */
export interface CognitoUserPoolConfiguration {
  /**
   * How users will signin to their account.
   */
  signinMethod: CognitoUserPoolSigninMethod;
  /**
   * Account attributes that must be specified to sign up.
   */
  requiredSignupAttributes: CognitoUserProperty[];
  /**
   * Alias attributes that can be used for sign-up/sign-in
   */
  aliasAttributes?: CognitoUserAliasAttributes[];
  /**
   * The name of the user pool. If not specified, a unique string will be generated.
   */
  userPoolName?: string;
  /**
   * User pool groups to create within the user pool. If not specified, no groups are created.
   */
  userPoolGroups?: CognitoUserPoolGroup[];
  /**
   * If defined, an Admin Queries API is created.
   */
  adminQueries?: CognitoAdminQueries;
  /**
   * If defined, specifies MFA configuration. Default is MFA off.
   */
  mfa?: CognitoMFAConfiguration;
  /**
   * If defined, specifies password recovery configiuration. Default is email recovery.
   */
  passwordRecovery?: CognitoPasswordRecoveryConfiguration;
  /**
   * If defined, specifies password constraint configuration. Default is minimum length of 8 characters.
   */
  passwordPolicy?: CognitoPasswordPolicy;
  /**
   * Defines how long refresh tokens are valid in days. Default is 30 days.
   */
  refreshTokenPeriod?: number;
  /**
   * Defines which user attributes can be read by the app. Default is email.
   */
  readAttributes?: (CognitoUserProperty | CognitoUserPropertyVerified)[];
  /**
   * Defines which user attributes can be written by the app. Default is none.
   */
  writeAttributes?: CognitoUserProperty[];
  /**
   * If defined, specified oAuth configuration will be applied to the user pool.
   */
  oAuth?: CognitoOAuthConfiguration;
}

/**
 * Cognito OAuth configuration exposed by Amplify
 */
export interface CognitoOAuthConfiguration {
  /**
   * Your hosted UI domain name.
   */
  domainPrefix?: string;
  /**
   * Valid signin redirect URIs.
   */
  redirectSigninURIs: string[];
  /**
   * Valid signout redirect URIs.
   */
  redirectSignoutURIs: string[];
  /**
   * The oAuth grant type.
   */
  oAuthGrantType: 'CODE' | 'IMPLICIT';
  /**
   * The oAuth scopes granted by signin.
   */
  oAuthScopes: ('PHONE' | 'EMAIL' | 'OPENID' | 'PROFILE' | 'AWS.COGNITO.SIGNIN.USER.ADMIN')[];
  /**
   * If defined, users will be able to login with the specified social providers.
   */
  socialProviderConfigurations?: CognitoSocialProviderConfiguration[];
}

/**
 * Defines a Cognito oAuth social provider
 */
interface SocialProviderConfig {
  /**
   * Social providers supported by Amplify and Cognito
   */
  provider: 'FACEBOOK' | 'GOOGLE' | 'LOGIN_WITH_AMAZON';
  /**
   * The client ID (sometimes called app ID) configured with the provider.
   */
  clientId: string;
  /**
   * The client secret (sometimes called an app secret) configured with the provider.
   */
  clientSecret: string;
}

/**
 * Defines a Cognito Sign in with Apple oAuth social provider
 */
interface SignInWithAppleSocialProviderConfig {
  provider: 'SIGN_IN_WITH_APPLE';
  /**
   * The client ID (sometimes called apple services ID) configured with the provider.
   */
  clientId: string;
  /**
   * The team ID configured with the provider
   */
  teamId: string;
  /**
   * The key ID (sometimes called apple private key ID) configured with the provider.
   */
  keyId: string;
  /**
   * The private key configured with the provider. Value can be undefined on an update request.
   * Every member can be updated except the privateKey because the privateKey isn't easily retrievable.
   */
  privateKey?: string;
}

/**
 * Defines a Cognito oAuth social provider
 */
export type CognitoSocialProviderConfiguration = SocialProviderConfig | SignInWithAppleSocialProviderConfig;

export interface CognitoPasswordPolicy {
  minimumLength?: number;
  additionalConstraints?: CognitoPasswordConstraint[];
}

export type CognitoPasswordRecoveryConfiguration = CognitoEmailPasswordRecoveryConfiguration | CognitoSMSPasswordRecoveryConfiguration;

/**
 * Defines the email that will be sent to users to recover their password.
 */
export interface CognitoEmailPasswordRecoveryConfiguration {
  deliveryMethod: 'EMAIL';
  emailMessage: string;
  emailSubject: string;
}

/**
 * Defines the SMS message that will be send to users to recover their password
 */
export interface CognitoSMSPasswordRecoveryConfiguration {
  deliveryMethod: 'SMS';
  smsMessage: string;
}

export type CognitoMFAConfiguration = CognitoMFAOff | CognitoMFASettings;

/**
 * Specifies that MFA should not be enabled for the user pool.
 */
export interface CognitoMFAOff {
  mode: 'OFF';
}

/**
 * Specifies that MFA is enabled for the user pool.
 */
export interface CognitoMFASettings {
  /**
   * ON requires users to set up MFA when creating an account. OPTIONAL means the user has the option to set up MFA.
   */
  mode: 'ON' | 'OPTIONAL';
  /**
   * MFA delivery options.
   */
  mfaTypes: ('SMS' | 'TOTP')[];
  /**
   * If SMS is specified in "mfaTypes" this specifies the smsMessage that will be sent to the user.
   */
  smsMessage: string;
}

/**
 * Configuration for the AdminQueries API
 */
export interface CognitoAdminQueries {
  /**
   * Defines the API permissions. groupName must only be specified if restrictAccess is true, in which case only the specified user pool group will have access to the Admin Queries API.
   */
  permissions: {
    restrictAccess: boolean;
    groupName?: string;
  };
}

/**
 * Defines a Cognito user pool group.
 */
export interface CognitoUserPoolGroup {
  /**
   * Not implemented and should not be used.
   */
  customPolicy?: string;
  /**
   * The group name.
   */
  groupName: string;
}

/**
 * Password contraints that can be applied to Cognito user pools.
 */
export enum CognitoPasswordConstraint {
  REQUIRE_LOWERCASE = 'REQUIRE_LOWERCASE',
  REQUIRE_UPPERCASE = 'REQUIRE_UPPERCASE',
  REQUIRE_DIGIT = 'REQUIRE_DIGIT',
  REQUIRE_SYMBOL = 'REQUIRE_SYMBOL',
}

export enum CognitoUserPoolSigninMethod {
  USERNAME = 'USERNAME',
  EMAIL = 'EMAIL',
  PHONE_NUMBER = 'PHONE_NUMBER',
  EMAIL_AND_PHONE_NUMBER = 'EMAIL_AND_PHONE_NUMBER',
}

export enum CognitoUserAliasAttributes {
  PREFERRED_USERNAME = 'PREFERRED_USERNAME',
  EMAIL = 'EMAIL',
  PHONE_NUMBER = 'PHONE_NUMBER',
}

export enum CognitoUserProperty {
  ADDRESS = 'ADDRESS',
  BIRTHDATE = 'BIRTHDATE',
  EMAIL = 'EMAIL',
  FAMILY_NAME = 'FAMILY_NAME',
  MIDDLE_NAME = 'MIDDLE_NAME',
  GENDER = 'GENDER',
  LOCALE = 'LOCALE',
  GIVEN_NAME = 'GIVEN_NAME',
  NAME = 'NAME',
  NICKNAME = 'NICKNAME',
  PHONE_NUMBER = 'PHONE_NUMBER',
  PREFERRED_USERNAME = 'PREFERRED_USERNAME',
  PICTURE = 'PICTURE',
  PROFILE = 'PROFILE',
  UPDATED_AT = 'UPDATED_AT',
  WEBSITE = 'WEBSITE',
  ZONE_INFO = 'ZONE_INFO',
}

/**
 * Additional Cognito user properties that can only be read, not written.
 */
export enum CognitoUserPropertyVerified {
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  PHONE_NUMBER_VERIFIED = 'PHONE_NUMBER_VERIFIED',
}
