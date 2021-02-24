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
  UpdateAuthRequest,
  CognitoUserPoolConfiguration,
  CognitoUserPoolModification,
  CognitoIdentityPoolModification,
} from 'amplify-headless-interface';
import { identityPoolProviders, userPoolProviders } from '../service-walkthroughs/auth-questions';
import { isEmpty, merge } from 'lodash';
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
} from '../service-walkthrough-types';
import { pascalCase } from 'change-case';

export type AddAuthRequestAdaptorFactory = (projectType: string) => AddAuthRequestAdaptor;

export type AddAuthRequestAdaptor = (request: AddAuthRequest) => ServiceQuestionsResult;
/**
 * Factory function that returns a function to convert an AddAuthRequest into the existing ServiceQuestionsResult output format
 * @param projectType The project type (such as 'javascript', 'ios', 'android')
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
    requiredAttributes,
    ...immutableAttributeAdaptor(userPoolConfig, identityPoolConfig),
    ...mutableAttributeAdaptor(projectType, requiredAttributes, userPoolConfig, cognitoConfig.includeIdentityPool, identityPoolConfig),
  };
};

export const getUpdateAuthRequestAdaptor = (projectType: string, requiredAttributes: string[]) => ({
  serviceModification,
}: UpdateAuthRequest): ServiceQuestionsResult => {
  const idPoolModification = serviceModification.includeIdentityPool ? serviceModification.identityPoolModification : undefined;
  return {
    serviceName: serviceModification.serviceName,
    requiredAttributes,
    ...mutableAttributeAdaptor(
      projectType,
      requiredAttributes,
      serviceModification.userPoolModification,
      serviceModification.includeIdentityPool,
      idPoolModification,
    ),
  };
};

const immutableAttributeAdaptor = (userPoolConfig: CognitoUserPoolConfiguration, identityPoolConfig?: CognitoIdentityPoolConfiguration) => {
  return {
    userPoolName: userPoolConfig.userPoolName,
    usernameAttributes: signinAttributeMap[userPoolConfig.signinMethod],
    ...immutableIdentityPoolMap(identityPoolConfig),
  };
};

const mutableAttributeAdaptor = (
  projectType: string,
  requiredAttributes: string[],
  userPoolConfig: CognitoUserPoolConfiguration | CognitoUserPoolModification,
  includeIdentityPool: boolean,
  identityPoolConfig?: CognitoIdentityPoolConfiguration | CognitoIdentityPoolModification,
) => {
  return {
    useDefault: 'manual' as const,
    updateFlow: 'manual' as const,
    authSelections: includeIdentityPool ? 'identityPoolAndUserPool' : ('userPoolOnly' as 'userPoolOnly' | 'identityPoolAndUserPool'),
    userPoolGroups: (userPoolConfig.userPoolGroups?.length || 0) > 0,
    userPoolGroupList: (userPoolConfig.userPoolGroups || []).map(group => group.groupName), // TODO may need to map "customPolicy"
    userpoolClientRefreshTokenValidity: userPoolConfig.refreshTokenPeriod,
    userpoolClientReadAttributes: (userPoolConfig.readAttributes || []).map(att => att.toLowerCase()),
    userpoolClientWriteAttributes: (userPoolConfig.writeAttributes || []).map(att => att.toLowerCase()),
    ...adminQueriesMap(userPoolConfig.adminQueries),
    ...mfaMap(userPoolConfig.mfa),
    ...passwordRecoveryMap(userPoolConfig.passwordRecovery),
    ...passwordPolicyMap(userPoolConfig.passwordPolicy),
    ...mutableIdentityPoolMap(projectType, identityPoolConfig),
    ...oauthMap(userPoolConfig.oAuth, requiredAttributes),
  };
};

// converts the oauth config to the existing format
const oauthMap = (
  oauthConfig?: Partial<CognitoOAuthConfiguration>,
  requiredAttributes: string[] = [],
): (OAuthResult & SocialProviderResult) | {} => {
  if (!oauthConfig) return {};
  if (isEmpty(oauthConfig)) {
    return {
      hostedUI: false,
    };
  }
  return {
    hostedUI: true,
    hostedUIDomainName: oauthConfig.domainPrefix,
    newCallbackURLs: oauthConfig.redirectSigninURIs,
    newLogoutURLs: oauthConfig.redirectSignoutURIs,
    AllowedOAuthFlows: oauthConfig?.oAuthGrantType?.toLowerCase() as 'code' | 'implicit',
    AllowedOAuthScopes: oauthConfig?.oAuthScopes?.map(scope => scope.toLowerCase()),
    ...socialProviderMap(oauthConfig.socialProviderConfigurations, requiredAttributes),
  };
};

// converts the oauth social provider config to the existing format
const socialProviderMap = (
  socialConfig: CognitoSocialProviderConfiguration[] = [],
  requiredAttributes: string[] = [],
): SocialProviderResult => {
  const authProvidersUserPool = socialConfig.map(sc => sc.provider).map(provider => pascalCase(provider));
  const socialConfigMap = socialConfig.reduce((acc, it) => {
    switch (it.provider) {
      case 'FACEBOOK':
        acc.facebookAppIdUserPool = it.clientId;
        acc.facebookAppSecretUserPool = it.clientSecret;
        break;
      case 'GOOGLE':
        acc.googleAppIdUserPool = it.clientId;
        acc.googleAppSecretUserPool = it.clientSecret;
        break;
      case 'LOGIN_WITH_AMAZON':
        acc.loginwithamazonAppIdUserPool = it.clientId;
        acc.loginwithamazonAppSecretUserPool = it.clientSecret;
        break;
    }
    return acc;
  }, {} as any) as SocialProviderResult;
  const result: SocialProviderResult = {
    authProvidersUserPool,
    ...socialConfigMap,
    ...userPoolProviders(authProvidersUserPool, { requiredAttributes, ...socialConfigMap, hostedUI: true }),
  };
  return result;
};

// converts the identity pool config to the existing format
const mutableIdentityPoolMap = (
  projectType: string,
  idPoolConfig?: CognitoIdentityPoolConfiguration | CognitoIdentityPoolModification,
): IdentityPoolResult => {
  if (!idPoolConfig)
    return {
      thirdPartyAuth: false,
      authProviders: [],
    };
  type AppIds = Pick<IdentityPoolResult, 'facebookAppId' | 'googleClientId' | 'googleIos' | 'googleAndroid' | 'amazonAppId'>;
  const result = {
    allowUnauthenticatedIdentities: idPoolConfig.unauthenticatedLogin,
    thirdPartyAuth: !!idPoolConfig.identitySocialFederation,
    authProviders: (idPoolConfig.identitySocialFederation || [])
      .map(socialFed => socialFed.provider)
      .map(provider => pascalCase(provider))
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

const immutableIdentityPoolMap = (idPoolConfig?: CognitoIdentityPoolConfiguration) => ({
  identityPoolName: idPoolConfig?.identityPoolName,
});

// converts the password policy to the existing format
const passwordPolicyMap = (pwPolicy?: CognitoPasswordPolicy): PasswordPolicyResult => {
  if (!pwPolicy) return {};
  return {
    passwordPolicyMinLength: pwPolicy.minimumLength,
    passwordPolicyCharacters: (pwPolicy.additionalConstraints || []).map(constraint => passwordConstraintMap[constraint]),
  };
};

// converts admin queries config to existing format
const adminQueriesMap = (adminQueries?: CognitoAdminQueries): AdminQueriesResult => {
  return {
    adminQueries: !!adminQueries,
    adminQueryGroup: adminQueries?.permissions.groupName,
  };
};

// converts mfa config to existing format
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

// converts password recovery config to existing format
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

const passwordConstraintMap: Record<CognitoPasswordConstraint, PasswordPolicy> = {
  [CognitoPasswordConstraint.REQUIRE_LOWERCASE]: 'Requires Lowercase',
  [CognitoPasswordConstraint.REQUIRE_DIGIT]: 'Requires Numbers',
  [CognitoPasswordConstraint.REQUIRE_SYMBOL]: 'Requires Symbols',
  [CognitoPasswordConstraint.REQUIRE_UPPERCASE]: 'Requires Uppercase',
};

const mfaTypeMap: Record<'SMS' | 'TOTP', 'SMS Text Message' | 'TOTP'> = {
  SMS: 'SMS Text Message',
  TOTP: 'TOTP',
};

const signinAttributeMap: Record<CognitoUserPoolSigninMethod, UsernameAttributes[] | undefined> = {
  [CognitoUserPoolSigninMethod.USERNAME]: undefined,
  [CognitoUserPoolSigninMethod.EMAIL]: ['email'],
  [CognitoUserPoolSigninMethod.PHONE_NUMBER]: ['phone_number'],
  [CognitoUserPoolSigninMethod.EMAIL_AND_PHONE_NUMBER]: ['email', 'phone_number'],
};

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
        case 'javascript':
          return 'googleClientId';
        default:
          throw new Error(`Unknown project type [${projectType}] when mapping federation type`);
      }
    default:
      throw new Error(`Unknown social federation provider [${provider}]`);
  }
};
