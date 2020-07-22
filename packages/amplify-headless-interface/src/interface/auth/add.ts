/**
 * Defines acceptable payloads to amplify add auth --stdin
 */
export interface AddAuthRequest {
  version: 1;
  serviceConfiguration: CognitoServiceConfiguration;
}

/**
 * Defines AWS Cognito parameters
 */
export type CognitoServiceConfiguration = BaseCognitoServiceConfiguration & (NoCognitoIdentityPool | CognitoIdentityPool);

/**
 * Configuration that applies to all Cognito configuration
 */
export interface BaseCognitoServiceConfiguration {
  serviceName: 'cognito';
  userPoolConfiguration: CognitoUserPoolConfiguration;
}

/**
 * Specifies that the Cognito configuration should not include an identity pool
 */
export interface NoCognitoIdentityPool {
  includeIdentityPool: false;
}

/**
 * Specifies that the Cognito configuration includes an identity pool configuration
 */
export interface CognitoIdentityPool {
  includeIdentityPool: true;
  /**
   * The identity pool configuration. If not specified, defaults are applied
   */
  identityPoolConfiguration?: CognitoIdentityPoolConfiguration;
}

export interface CognitoIdentityPoolConfiguration {
  /**
   * If not specified, a random string is generated
   */
  identityPoolName?: string;
  unauthenticatedLogin?: boolean;
  identitySocialFederation?: {
    facebook?: {
      facebookAppId: string;
    };
    google?: {
      googleClientId: string;
    };
    amazon?: {
      amazonAppId: string;
    };
  };
}

export interface CognitoUserPoolConfiguration {
  signinMethod: CognitoUserPoolSigninMethod;
  requiredSignupInformation: CognitoUserProperty[];
  userPoolName?: string;
  userPoolGroups?: CognitoUserPoolGroup[];
  adminQueries?: CognitoAdminQueries;
  mfa?: CognitoMFAConfiguration;
  forgotPassword?: CognitoForgotPasswordConfiguration;
  passwordPolicy?: CognitoPasswordPolicy;
  refreshTokenPeriod?: number;
  readAttributes?: CognitoUserProperty[];
  writeAttributes?: CognitoUserProperty[];
  oAuth?: CognitoOAuthConfiguration;
  confirmationRedirect?: CognitoConfirmationRedirectConfiguration;
  addUserToGroup?: {
    groupName: string;
  };
  emailBlacklist?: string[];
  emailWhitelist?: string[];
  customAuthScaffolding?: {
    customChallengeAnswer: string;
  };
}

export interface CognitoOAuthConfiguration {
  domainPrefix?: string;
  redirectSigninURIs: string[];
  redirectSignoutURIs: string[];
  oAuthGrantType: 'CODE' | 'IMPLICIT';
  oAuthScopes: ('PHONE' | 'EMAIL' | 'OPENID' | 'PROFILE' | 'AWS.COGNITO.SIGNIN.USER.ADMIN')[];
  socialProviderSettings?: {
    Facebook?: {
      appId: string;
      appSecret: string;
    };
    Google?: {
      webClientId: string;
      webClientSecret: string;
    };
    LoginWithAmazon?: {
      appId: string;
      appSecret: string;
    };
  };
}

export interface CognitoConfirmationRedirectConfiguration {
  redirectURL: string;
  emailSubject: string;
  emailMessage: string;
}

export interface CognitoPasswordPolicy {
  minimumLength: number;
  additionalConstraints: CognitoPasswordConstraint[];
}

export type CognitoForgotPasswordConfiguration = CognitoForgotPasswordEmailConfiguration | CognitoForgotPasswordSMSConfiguration;

export interface CognitoForgotPasswordEmailConfiguration {
  deliveryMethod: 'EMAIL';
  emailMessage: string;
  emailSubject: string;
}

export interface CognitoForgotPasswordSMSConfiguration {
  deliveryMethod: 'SMS';
  smsMessage: string;
}

export type CognitoMFAConfiguration = CognitoMFAOff | CognitoMFASettings;

export interface CognitoMFAOff {
  mode: 'OFF';
}

export interface CognitoMFASettings {
  mode: 'ON' | 'OPTIONAL';
  mfaTypes: ('SMS' | 'TOTP')[];
  smsMessage: string;
  mfaWithCaptcha?: {
    googleRecaptchaSecret: string;
  };
}

export interface CognitoAdminQueries {
  permissions: {
    restrictAccess: boolean;
    groupName?: string;
  };
}

export interface CognitoUserPoolGroup {
  priority: number;
  customPolicy?: string;
  groupName: string;
}

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
