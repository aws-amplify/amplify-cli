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
  CognitoSocialProviderConfiguration,
} from 'amplify-headless-interface';
import { identityPoolProviders, userPoolProviders } from '../service-walkthroughs/auth-questions';
import { merge } from 'lodash';
import { authProviders as authProviderList } from '../assets/string-maps';
import {
  ServiceQuestionsResult,
  OAuthResult,
  SocialProviderResult,
  IdentityPoolResult,
  PasswordPolicyResult,
  AdminQueriesResult,
  MfaResult,
  PasswordPolicy,
  PasswordRecoveryResult,
  UsernameAttributes,
} from '../legacy-types';

export type AddAuthRequestAdaptorFactory = (projectType: string) => AddAuthRequestAdaptor;

export type AddAuthRequestAdaptor = (request: AddAuthRequest) => ServiceQuestionsResult;
/**
 * Converts an AddAuthRequest into the existing serviceQuestions output format
 * @param request
 */
export const getAddAuthRequestAdaptor: AddAuthRequestAdaptorFactory = projectType => ({
  serviceConfiguration: cognitoConfig,
  resourceName,
}): ServiceQuestionsResult => {
  const userPoolConfig = cognitoConfig.userPoolConfiguration;
  const identityPoolConfig = cognitoConfig.includeIdentityPool ? cognitoConfig.identityPoolConfiguration : undefined;
  const requiredAttributes = userPoolConfig.requiredSignupAttributes.map(att => att.toLowerCase());
  return {
    serviceName: cognitoConfig.serviceName,
    resourceName,
    useDefault: 'manual',
    requiredAttributes,
    authSelections: cognitoConfig.includeIdentityPool ? 'identityPoolAndUserPool' : 'userPoolOnly',
    userPoolName: userPoolConfig.userPoolName,
    usernameAttributes: signinAttributeMap[userPoolConfig.signinMethod],
    userPoolGroups: (userPoolConfig.userPoolGroups?.length || 0) > 0,
    userPoolGroupList: (userPoolConfig.userPoolGroups || []).map(group => group.groupName), // TODO may need to map "customPolicy"
    userpoolClientRefreshTokenValidity: userPoolConfig.refreshTokenPeriod,
    userpoolClientReadAttributes: (userPoolConfig.readAttributes || []).map(att => att.toLowerCase()),
    userpoolClientWriteAttributes: (userPoolConfig.writeAttributes || []).map(att => att.toLowerCase()),
    ...adminQueriesMap(userPoolConfig.adminQueries),
    ...mfaMap(userPoolConfig.mfa),
    ...passwordRecoveryMap(userPoolConfig.passwordRecovery),
    ...passwordPolicyMap(userPoolConfig.passwordPolicy),
    ...identityPoolMap(identityPoolConfig, projectType),
    ...oauthMap(userPoolConfig.oAuth, requiredAttributes),
  };
};

const oauthMap = (oauthConfig?: CognitoOAuthConfiguration, requiredAttributes: string[] = []): OAuthResult & SocialProviderResult => {
  if (!oauthConfig) return { hostedUI: false };
  return {
    hostedUI: true,
    hostedUIDomainName: oauthConfig.domainPrefix,
    newCallbackURLs: oauthConfig.redirectSigninURIs,
    newLogoutURLs: oauthConfig.redirectSignoutURIs,
    AllowedOAuthFlows: oauthConfig.oAuthGrantType.toLowerCase() as 'code' | 'implicit',
    AllowedOAuthScopes: oauthConfig.oAuthScopes.map(scope => scope.toLowerCase()),
    ...socialProviderMap(oauthConfig.socialProviderConfigurations, requiredAttributes),
  };
};

const socialProviderMap = (
  socialConfig: CognitoSocialProviderConfiguration[] = [],
  requiredAttributes: string[] = [],
): SocialProviderResult => {
  const authProvidersUserPool = socialConfig.map(sc => sc.provider).map(upperSnakeCaseToUpperCamelCase);
  const result: ReturnType<typeof socialProviderMap> = {
    authProvidersUserPool,
    ...userPoolProviders(authProvidersUserPool, { requiredAttributes }),
  };
  socialConfig.forEach(sc => {
    switch (sc.provider) {
      case 'FACEBOOK':
        result.facebookAppIdUserPool = sc.clientId;
        result.facebookAppSecretUserPool = sc.clientSecret;
        break;
      case 'GOOGLE':
        result.googleAppIdUserPool = sc.clientId;
        result.googleAppSecretUserPool = sc.clientSecret;
        break;
      case 'LOGIN_WITH_AMAZON':
        result.loginwithamazonAppIdUserPool = sc.clientId;
        result.loginwithamazonAppSecretUserPool = sc.clientSecret;
        break;
    }
  });
  return result;
};

const identityPoolMap = (idPoolConfig: CognitoIdentityPoolConfiguration | undefined, projectType: string): IdentityPoolResult => {
  if (!idPoolConfig)
    return {
      thirdPartyAuth: false,
      authProviders: [],
    };
  type AppIds = Pick<IdentityPoolResult, 'facebookAppId' | 'googleClientId' | 'googleIos' | 'googleAndroid' | 'amazonAppId'>;
  const result = {
    identityPoolName: idPoolConfig.identityPoolName,
    allowUnauthenticatedIdentities: idPoolConfig.unauthenticatedLogin,
    thirdPartyAuth: !!idPoolConfig.identitySocialFederation,
    authProviders: (idPoolConfig.identitySocialFederation || [])
      .map(socialFed => socialFed.provider)
      .map(toTitleCase)
      .map(provider => authProviderList.find(ap => ap.name === provider)!)
      .map(ap => ap.value),
    // convert the list of social federation configs into individual key: client id pairs
    ...(idPoolConfig?.identitySocialFederation || []).reduce(
      (acc, it): AppIds => merge(acc, { [socialFederationKeyMap(it.provider, projectType)]: it.clientId }),
      {} as AppIds,
    ),
  };
  // adds "selectedParties" an "audiences" to the result which is a JSON string of the authProviders mapped to the client ids
  identityPoolProviders(result, projectType);
  return result;
};

const passwordPolicyMap = (pwPolicy?: CognitoPasswordPolicy): PasswordPolicyResult => {
  if (!pwPolicy) return {};
  return {
    passwordPolicyMinLength: pwPolicy.minimumLength,
    passwordPolicyCharacters: (pwPolicy.additionalConstraints || []).map(constraint => passwordConstraintMap[constraint]),
  };
};

const adminQueriesMap = (adminQueries?: CognitoAdminQueries): AdminQueriesResult => {
  return {
    adminQueries: !!adminQueries,
    adminQueryGroup: adminQueries?.permissions.groupName,
  };
};

const mfaMap = (mfaConfig: CognitoMFAConfiguration = { mode: 'OFF' }): MfaResult => {
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

const passwordRecoveryMap = (pwRecoveryConfig?: CognitoPasswordRecoveryConfiguration): PasswordRecoveryResult => {
  switch (pwRecoveryConfig?.deliveryMethod) {
    case 'SMS':
      return {
        smsVerificationMessage: pwRecoveryConfig?.smsMessage,
        autoVerifiedAttributes: ['phone_number'],
      };
    case 'EMAIL':
      return {
        emailVerificationMessage: pwRecoveryConfig?.emailMessage,
        emailVerificationSubject: pwRecoveryConfig?.emailSubject,
        autoVerifiedAttributes: ['email'],
      };
    default:
      return {
        autoVerifiedAttributes: [],
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

const toTitleCase = (word: string): string =>
  word
    .charAt(0)
    .toUpperCase()
    .concat(word.slice(1).toLowerCase());

const upperSnakeCaseToUpperCamelCase = (str: string): string =>
  str
    .toLowerCase()
    .replace(/(^\w|_\w)/g, group => group.toUpperCase()) // upper case first letter and any letter after an underscore
    .replace(/_/g, ''); // remove underscores

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
