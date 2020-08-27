import {AddAuthRequest, CognitoUserPoolSigninMethod, CognitoUserProperty, CognitoAdminQueries, CognitoMFASettings, CognitoMFAConfiguration, CognitoPasswordRecoveryConfiguration, CognitoPasswordPolicy, CognitoPasswordConstraint, CognitoUserPropertyVerified} from 'amplify-headless-interface';
import { userPoolProviders } from '../service-walkthroughs/auth-questions';

export const serviceQuestionsResultToAddAuthRequest = (result: ServiceQuestionsResult): AddAuthRequest => {
  const result: AddAuthRequest = {
    version: 1,
    serviceConfiguration: {
      serviceName: 'cognito',
      userPoolConfiguration: {
        signinMethod: signinMethodMap[result.usernameAttributes],
        requiredSignupInformation: result.requiredAttributes.map(userPropertyMap),
        userPoolName: result.userPoolName,
        userPoolGroups: (result.userPoolGroupList || []).map(name => ({groupName: name})), // TODO may need to map "customPolicy" here
        adminQueries: adminQueriesMap(result),
        mfa: mfaMap(result),
        passwordRecovery: passwordRecoveryMap(result),
        passwordPolicy: passwordPolicyMap(result),
        refreshTokenPeriod: result.userpoolClientRefreshTokenValidity,
        readAttributes: (result.userpoolClientReadAttributes || []).map(readAttributeMap),
        writeAttributes: (result.userpoolClientWriteAttributes || []).map(userPropertyMap),
        oAuth: 
      }
    }
  }
}

const oAuthMap = (result: Pick<ServiceQuestionsResult, 'hostedUIDomainName' | 'redirect')

const readAttributeMap = (userProperty: string): CognitoUserProperty | CognitoUserPropertyVerified => {
  if (['email_verified', 'phone_number_verified'].includes(userProperty)) {
    return CognitoUserPropertyVerified[userProperty.toUpperCase() as keyof typeof CognitoUserPropertyVerified];
  } else {
    return userPropertyMap(userProperty);
  }
}

const passwordPolicyMap = (result: Pick<ServiceQuestionsResult, 'passwordPolicyCharacters' | 'passwordPolicyMinLength'>): CognitoPasswordPolicy | undefined => {
  if (result.passwordPolicyCharacters || result.passwordPolicyMinLength) {
    return {
      minimumLength: result.passwordPolicyMinLength,
      additionalConstraints: (result.passwordPolicyCharacters || []).map(constraint => passwordConstraintMap[constraint]),
    };
  }
}

const passwordConstraintMap: Record<string, CognitoPasswordConstraint> = {
  'Requires Lowercase': CognitoPasswordConstraint.REQUIRE_LOWERCASE,
  'Requires Numbers': CognitoPasswordConstraint.REQUIRE_DIGIT,
  'Requires Symbols': CognitoPasswordConstraint.REQUIRE_SYMBOL,
  'Requires Uppercase': CognitoPasswordConstraint.REQUIRE_UPPERCASE,
}

const passwordRecoveryMap = (result: Pick<ServiceQuestionsResult, 'emailVerificationMessage' | 'emailVerificationSubject' | 'smsVerificationMessage'>): CognitoPasswordRecoveryConfiguration | undefined => {
  if (result.smsVerificationMessage) {
    return {
      deliveryMethod: 'SMS',
      smsMessage: result.smsVerificationMessage,
    };
  }
  if (result.emailVerificationMessage && result.emailVerificationSubject) {
    return {
      deliveryMethod: 'EMAIL',
      emailMessage: result.emailVerificationMessage,
      emailSubject: result.emailVerificationSubject,
    };
  }
}

const mfaMap = (result: Pick<ServiceQuestionsResult, 'mfaConfiguration' | 'mfaTypes' | 'smsAuthenticationMessage'>): CognitoMFAConfiguration => {
  if (result.mfaConfiguration === 'OFF') {
    return {
      mode: 'OFF'
    }
  }
  return {
    mode: result.mfaConfiguration,
    mfaTypes: result.mfaTypes.map(type => mfaTypeMap[type]),
    smsMessage: result.smsAuthenticationMessage,
  }
}

const mfaTypeMap: Record<'SMS Text Message' | 'TOTP', 'SMS' | 'TOTP'> = {
  'SMS Text Message': 'SMS',
  TOTP: 'TOTP',
};

const adminQueriesMap = (result: Pick<ServiceQuestionsResult, 'adminQueries' | 'adminQueryGroup'>): CognitoAdminQueries | undefined => {
  if (!result.adminQueries) return;
  return {
    permissions: {
      restrictAccess: !!result.adminQueryGroup,
      groupName: result.adminQueryGroup,
    },
  };
}

const userPropertyMap = (userProperty: string): CognitoUserProperty => {
  return CognitoUserProperty[userProperty.toUpperCase() as keyof typeof CognitoUserProperty];
}

const signinMethodMap: Record<string, CognitoUserPoolSigninMethod> = {
  username: CognitoUserPoolSigninMethod.USERNAME,
  email: CognitoUserPoolSigninMethod.EMAIL,
  phone_number: CognitoUserPoolSigninMethod.PHONE_NUMBER,
  'email, phone_number': CognitoUserPoolSigninMethod.EMAIL_AND_PHONE_NUMBER,
}

interface ServiceQuestionsResult {
  useDefault: string;
  authSelections: string;
  audiences?: string[];
  resourceName: string;
  resourceNameTruncated: string;
  identityPoolName: string;
  allowUnauthenticatedIdentities: boolean,
  thirdPartyAuth: boolean;
  authProviders: string[];
  userPoolName: string;
  usernameAttributes?: string;
  userPoolGroups: boolean;
  adminQueries: boolean;
  mfaConfiguration: 'OPTIONAL' | 'ON' | 'OFF';
  mfaTypes?: ('SMS Text Message' | 'TOTP')[];
  smsAuthenticationMessage?: string;
  autoVerifiedAttributes: string[];
  emailVerificationSubject: string;
  emailVerificationMessage: string;
  smsVerificationMessage: string;
  defaultPasswordPolicy: boolean;
  passwordPolicyCharacters: ('Requires Lowercase' | 'Requires Numbers' | 'Requires Symbols' | 'Requires Uppercase')[];
  passwordPolicyMinLength: number;
  requiredAttributes: string[];
  userpoolClientRefreshTokenValidity: number;
  userpoolClientSetAttributes?: boolean;
  userpoolClientReadAttributes: string[];
  userpoolClientWriteAttributes: string[];
  userPoolGroupList?: string[];
  adminQueryGroup: string;
  triggers?: Record<TriggerType, string[]>;
  hostedUI: boolean;
  hostedUIDomainName?: string;
  hostedUIProviderMeta?: any;
  selectedParties: string; // serialized json
  verificationBucketName: string;
  updatingAuth: {
    verificationBucketName: string;
  },
  newCallbackURLs: string[],
  parentStack?: any;
  permissions?: string[]; // array of serialized json with format {trigger: string, policyName: string, actions: string[] // strignified json, resource: {paramType, keys}}
  dependsOn?: {
    resourceName: string;
    attributes: string[];
  };
  oAuthMetadata?: any;
  googleClientId?: string;
  googleIos?: string;
  googleAndroid?: string;
  facebookAppId?: string;
  amazonAppId?: string;
}

enum TriggerType {
  CreateAuthChallenge = 'CreateAuthChallenge',
  CustomMessage = 'CustomMessage',
  DefineAuthChallenge = 'DefineAuthChallenge',
  PostAuthentication = 'PostAuthentication',
  PostConfirmation = 'PostConfirmation',
  PreAuthentication = 'PreAuthentication',
  PreSignup = 'PreSignup',
  VerifyAuthChallengeResponse = 'VerifyAuthChallengeResponse',
  PreTokenGeneration = 'PreTokenGeneration',
}