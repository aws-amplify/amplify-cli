import {
  AddAuthRequest,
  CognitoUserPoolSigninMethod,
  CognitoAdminQueries,
  CognitoMFAConfiguration,
  CognitoPasswordRecoveryConfiguration,
  CognitoPasswordPolicy,
  CognitoPasswordConstraint,
  CognitoIdentityPoolConfiguration,
  CognitoOAuthConfiguration,
} from 'amplify-headless-interface';
import { identityPoolProviders } from '../service-walkthroughs/auth-questions';
import { merge } from 'lodash';
import { authProviders as authProviderList } from '../assets/string-maps';

export type AddAuthRequestAdaptorFactory = (projectType: string) => AddAuthRequestAdaptor;

export type AddAuthRequestAdaptor = (request: AddAuthRequest) => ServiceQuestionsResult;
/**
 * Converts an AddAuthRequest into the existing serviceQuestions output format
 * @param request
 */
export const addAuthRequestAdaptorFactory: AddAuthRequestAdaptorFactory = projectType => ({
  serviceConfiguration: cognitoConfig,
  resourceName,
}): ServiceQuestionsResult => {
  const userPoolConfig = cognitoConfig.userPoolConfiguration;
  const identityPoolConfig = cognitoConfig.includeIdentityPool ? cognitoConfig.identityPoolConfiguration : undefined;
  return {
    resourceName: resourceName,
    useDefault: 'manual',
    authSelections: cognitoConfig.includeIdentityPool ? 'identityPoolAndUserPool' : 'userPoolOnly',
    userPoolName: userPoolConfig.userPoolName,
    usernameAttributes: signinAttributeMap[userPoolConfig.signinMethod],
    userPoolGroups: userPoolConfig.userPoolGroups?.length > 0,
    userPoolGroupList: (userPoolConfig.userPoolGroups || []).map(group => group.groupName), // TODO may need to map "customPolicy"
    requiredAttributes: userPoolConfig.requiredSignupAttributes.map(att => att.toLowerCase()),
    userpoolClientRefreshTokenValidity: userPoolConfig.refreshTokenPeriod,
    userpoolClientReadAttributes: userPoolConfig.readAttributes.map(att => att.toLowerCase()),
    userpoolClientWriteAttributes: userPoolConfig.writeAttributes.map(att => att.toLowerCase()),
    ...adminQueriesMap(userPoolConfig.adminQueries),
    ...mfaMap(userPoolConfig.mfa),
    ...passwordRecoveryMap(userPoolConfig.passwordRecovery),
    ...passwordPolicyMap(userPoolConfig.passwordPolicy),
    ...identityPoolMap(identityPoolConfig, projectType),
    ...oauthMap(userPoolConfig.oAuth),
  };
};

const oauthMap = (
  oauthConfig?: CognitoOAuthConfiguration,
): Pick<
  ServiceQuestionsResult,
  | 'hostedUI'
  | 'hostedUIDomainName'
  | 'hostedUIProviderMeta'
  | 'authProvidersUserPool'
  | 'AllowedOAuthFlows'
  | 'AllowedOAuthScopes'
  | 'newCallbackURLs'
  | 'newLogoutURLs'
  | 'oAuthMetadata'
  | 'facebookAppIdUserPool'
  | 'facebookAppSecretUserPool'
  | 'googleAppIdUserPool'
  | 'googleAppSecretUserPool'
  | 'loginwithamazonAppIdUserPool'
  | 'loginwithamazonAppSecretUserPool'
> => {
  if (!oauthConfig) return { hostedUI: false };
  return {
    hostedUI: true,
    hostedUIDomainName: oauthConfig.domainPrefix,
    newCallbackURLs: oauthConfig.redirectSigninURIs,
    newLogoutURLs: oauthConfig.redirectSignoutURIs,
    AllowedOAuthFlows: oauthConfig.oAuthGrantType.toLowerCase() as 'code' | 'implicit',
    AllowedOAuthScopes: oauthConfig.oAuthScopes.map(scope => scope.toLowerCase()),
  };
};

const identityPoolMap = (
  idPoolConfig: CognitoIdentityPoolConfiguration,
  projectType: string,
): Pick<
  ServiceQuestionsResult,
  | 'identityPoolName'
  | 'allowUnauthenticatedIdentities'
  | 'authProviders'
  | 'facebookAppId'
  | 'googleClientId'
  | 'googleIos'
  | 'googleAndroid'
  | 'amazonAppId'
  | 'selectedParties'
  | 'thirdPartyAuth'
> => {
  type AppIds = Pick<
    ReturnType<typeof identityPoolMap>,
    'facebookAppId' | 'googleClientId' | 'googleIos' | 'googleAndroid' | 'amazonAppId'
  >;
  const result = {
    identityPoolName: idPoolConfig.identityPoolName,
    allowUnauthenticatedIdentities: idPoolConfig.unauthenticatedLogin,
    thirdPartyAuth: !!idPoolConfig.identitySocialFederation,
    authProviders: (idPoolConfig.identitySocialFederation || [])
      .map(socialFed => socialFed.provider)
      .map(toTitleCase)
      .map(provider => authProviderList.find(ap => ap.name === provider))
      .map(ap => ap.value),
    // convert the list of social federation configs into individual key: client id pairs
    ...(idPoolConfig.identitySocialFederation || []).reduce(
      (acc, it): AppIds => merge(acc, { [socialFederationKeyMap(it.provider, projectType)]: it.clientId }),
      {} as AppIds,
    ),
  };
  identityPoolProviders(result, projectType); // adds "selectedParties" to the result which is a JSON string of the authProviders mapped to the client ids
  return result;
};

const toTitleCase = (word: string): string =>
  word
    .charAt(0)
    .toUpperCase()
    .concat(word.slice(1).toLowerCase());
const upperSnakeCaseToUpperCamelCase = (str: string): string =>
  str
    .toLowerCase()
    .replace(/(^\w|_\w)/g, group => group.toUpperCase())
    .replace(/_/g, '');

const socialFederationKeyMap = (provider: 'FACEBOOK' | 'AMAZON' | 'GOOGLE', projectType: string): string => {
  switch (provider) {
    case 'FACEBOOK':
      return 'facebookAppId';
    case 'AMAZON':
      return 'amazonAppId';
    case 'GOOGLE':
      switch (projectType) {
        case 'ios':
          return 'googleIos';
        case 'android':
          return 'googleAndroid';
        default:
          return 'googleClientId';
      }
  }
};

const passwordPolicyMap = (
  pwPolicy: CognitoPasswordPolicy,
): Pick<ServiceQuestionsResult, 'passwordPolicyCharacters' | 'passwordPolicyMinLength'> => {
  if (!pwPolicy) return {};
  return {
    passwordPolicyMinLength: pwPolicy.minimumLength,
    passwordPolicyCharacters: (pwPolicy.additionalConstraints || []).map(constraint => passwordConstraintMap[constraint]),
  };
};

const adminQueriesMap = (adminQueries: CognitoAdminQueries): Pick<ServiceQuestionsResult, 'adminQueries' | 'adminQueryGroup'> => {
  return {
    adminQueries: !!adminQueries,
    adminQueryGroup: adminQueries?.permissions.groupName,
  };
};

const mfaMap = (
  mfaConfig: CognitoMFAConfiguration = { mode: 'OFF' },
): Pick<ServiceQuestionsResult, 'mfaConfiguration' | 'mfaTypes' | 'smsAuthenticationMessage'> => {
  if (mfaConfig.mode === 'OFF') {
    return {
      mfaConfiguration: 'OFF',
    };
  }
  return {
    mfaConfiguration: mfaConfig.mode,
    mfaTypes: mfaConfig.mfaTypes.map(type => mfaTypeMap[type]),
    smsAuthenticationMessage: mfaConfig.smsMessage,
  };
};

const passwordConstraintMap: Record<CognitoPasswordConstraint, PasswordPolicy> = {
  [CognitoPasswordConstraint.REQUIRE_LOWERCASE]: 'Requires Lowercase',
  [CognitoPasswordConstraint.REQUIRE_DIGIT]: 'Requires Numbers',
  [CognitoPasswordConstraint.REQUIRE_SYMBOL]: 'Requires Symbols',
  [CognitoPasswordConstraint.REQUIRE_UPPERCASE]: 'Requires Uppercase',
};

const passwordRecoveryMap = (
  pwRecoveryConfig: CognitoPasswordRecoveryConfiguration,
): Pick<
  ServiceQuestionsResult,
  'emailVerificationMessage' | 'emailVerificationSubject' | 'smsVerificationMessage' | 'autoVerifiedAttributes'
> => {
  switch (pwRecoveryConfig?.deliveryMethod) {
    case 'SMS':
      return {
        smsVerificationMessage: pwRecoveryConfig.smsMessage,
        autoVerifiedAttributes: ['phone_number'],
      };
    default:
      return {
        emailVerificationMessage: pwRecoveryConfig.emailMessage,
        emailVerificationSubject: pwRecoveryConfig.emailSubject,
        autoVerifiedAttributes: ['email'],
      };
  }
};

const mfaTypeMap: Record<'SMS' | 'TOTP', 'SMS Text Message' | 'TOTP'> = {
  SMS: 'SMS Text Message',
  TOTP: 'TOTP',
};

const signinAttributeMap: Record<CognitoUserPoolSigninMethod, UsernameAttributes> = {
  [CognitoUserPoolSigninMethod.USERNAME]: 'username',
  [CognitoUserPoolSigninMethod.EMAIL]: 'email',
  [CognitoUserPoolSigninMethod.PHONE_NUMBER]: 'phone_number',
  [CognitoUserPoolSigninMethod.EMAIL_AND_PHONE_NUMBER]: 'email, phone_number',
};

export interface ServiceQuestionsResult {
  useDefault: string;
  authSelections: 'userPoolOnly' | 'identityPoolAndUserPool';
  audiences?: string[];
  resourceName: string;
  resourceNameTruncated?: string;
  identityPoolName?: string;
  allowUnauthenticatedIdentities?: boolean;
  thirdPartyAuth: boolean;
  authProviders: string[];
  userPoolName: string;
  usernameAttributes?: UsernameAttributes;
  userPoolGroups: boolean;
  adminQueries: boolean;
  mfaConfiguration: 'OPTIONAL' | 'ON' | 'OFF';
  mfaTypes?: ('SMS Text Message' | 'TOTP')[];
  smsAuthenticationMessage?: string;
  autoVerifiedAttributes: string[];
  emailVerificationSubject?: string;
  emailVerificationMessage?: string;
  smsVerificationMessage?: string;
  passwordPolicyCharacters?: PasswordPolicy[];
  passwordPolicyMinLength?: number;
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
  authProvidersUserPool?: string[];
  AllowedOAuthFlows?: 'code' | 'implicit';
  facebookAppIdUserPool?: string;
  facebookAppSecretUserPool?: string;
  googleAppIdUserPool?: string;
  googleAppSecretUserPool?: string;
  loginwithamazonAppIdUserPool?: string;
  loginwithamazonAppSecretUserPool?: string;
  selectedParties?: string; // serialized json
  newCallbackURLs?: string[];
  newLogoutURLs?: string[];
  AllowedOAuthScopes?: string[];
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

type PasswordPolicy = 'Requires Lowercase' | 'Requires Numbers' | 'Requires Symbols' | 'Requires Uppercase';

type UsernameAttributes = 'username' | 'email' | 'phone_number' | 'email, phone_number';

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
