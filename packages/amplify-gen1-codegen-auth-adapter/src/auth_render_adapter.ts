import {
  Lambda,
  AuthDefinition,
  EmailOptions,
  LoginOptions,
  PasswordPolicyPath,
  AuthTriggerEvents,
  MultifactorOptions,
  StandardAttributes,
  StandardAttribute,
  Attribute,
} from '@aws-amplify/amplify-gen2-codegen';
import {
  LambdaConfigType,
  IdentityProviderTypeType,
  PasswordPolicyType,
  ProviderDescription,
  UserPoolMfaType,
  UserPoolType,
  UserPoolClientType,
  SchemaAttributeType,
  GroupType,
} from '@aws-sdk/client-cognito-identity-provider';

export interface AuthTriggerConnection {
  triggerType: keyof LambdaConfigType;
  lambdaFunctionName: string;
}

export type AuthTriggerConnectionSourceMap = Partial<Record<keyof LambdaConfigType, string>>;

export interface AuthSynthesizerOptions {
  userPool: UserPoolType;
  identityProviders?: ProviderDescription[];
  identityGroups?: GroupType[];
  webClient?: UserPoolClientType;
  authTriggerConnections?: AuthTriggerConnectionSourceMap;
  guestLogin?: boolean;
}

export const DEFAULT_PASSWORD_SETTINGS: PasswordPolicyType = {
  MinimumLength: 8,
  RequireLowercase: true,
  RequireUppercase: true,
  RequireNumbers: true,
  TemporaryPasswordValidityDays: 3,
};

export type PasswordPolicyOverrides = Record<PasswordPolicyPath, string | boolean | number>;

const getPasswordPolicyOverrides = (passwordPolicy: Partial<PasswordPolicyType>): Partial<PasswordPolicyOverrides> => {
  const policyOverrides: Partial<PasswordPolicyOverrides> = {};
  const passwordOverridePath = (policyKey: keyof PasswordPolicyType): PasswordPolicyPath => `Policies.PasswordPolicy.${policyKey}`;
  for (const key of Object.keys(passwordPolicy)) {
    const typedKey: keyof PasswordPolicyType = key as keyof PasswordPolicyType;
    if (passwordPolicy[typedKey] !== undefined) {
      if (passwordPolicy[typedKey] === DEFAULT_PASSWORD_SETTINGS[typedKey]) {
        continue;
      }
      policyOverrides[passwordOverridePath(typedKey)] = passwordPolicy[typedKey];
    }
  }
  return policyOverrides;
};

const getMfaConfiguration = (mfa?: UserPoolMfaType): MultifactorOptions => {
  const multifactor: MultifactorOptions = {
    mode: 'OFF',
  };
  if (mfa === 'ON') {
    multifactor.mode = 'ON';
  }
  if (mfa === 'OPTIONAL') {
    multifactor.mode = 'OPTIONAL';
  }
  return multifactor;
};

const getEmailConfig = (userPool: UserPoolType): EmailOptions => {
  return {
    emailVerificationBody: userPool.EmailVerificationMessage ?? '',
    emailVerificationSubject: userPool.EmailVerificationSubject ?? '',
  };
};

const getUserAttributes = (signupAttributes: SchemaAttributeType[] | undefined): StandardAttributes => {
  const mappedUserAttributeName = {
    address: 'address',
    birthdate: 'birthdate',
    email: 'email',
    family_name: 'familyName',
    gender: 'gender',
    given_name: 'givenName',
    locale: 'locale',
    middle_name: 'middleName',
    name: 'fullname',
    nickname: 'nickname',
    phone_number: 'phoneNumber',
    picture: 'profilePicture',
    preferred_username: 'preferredUsername',
    profile: 'profilePage',
    zoneinfo: 'timezone',
    updated_at: 'lastUpdateTime',
    website: 'website',
  };
  return (
    signupAttributes?.reduce((standardAttributes: StandardAttributes, attribute: SchemaAttributeType) => {
      const standardAttribute: StandardAttribute = {
        required: attribute.Required,
        mutable: attribute.Mutable,
      };
      if (attribute.Name !== undefined && attribute.Name in mappedUserAttributeName) {
        return {
          ...standardAttributes,
          [mappedUserAttributeName[attribute.Name as keyof typeof mappedUserAttributeName] as Attribute]: standardAttribute,
        };
      }
      return standardAttributes;
    }, {} as StandardAttributes) || {}
  );
};

const getGroups = (identityGroups?: GroupType[]): string[] => {
  if (!identityGroups || identityGroups.length === 0) {
    return [];
  }
  const groupsWithPrecedence = identityGroups.filter((group) => group.Precedence !== undefined);

  return groupsWithPrecedence
    .sort((a, b) => (a.Precedence || 0) - (b.Precedence || 0))
    .map((group) => group.GroupName)
    .filter((groupName): groupName is string => groupName !== undefined);
};

/**
 * [getAuthDefinition] describes gen 1 auth resources in terms that can be used to generate Gen 2 code.
 */
const mappedLambdaConfigKey = (key: keyof LambdaConfigType): AuthTriggerEvents => {
  switch (key) {
    case 'PreSignUp':
      return 'preSignUp';
    case 'CustomMessage':
      return 'customMessage';
    case 'UserMigration':
      return 'userMigration';
    case 'PostConfirmation':
      return 'postConfirmation';
    case 'PreAuthentication':
      return 'preAuthentication';
    case 'PostAuthentication':
      return 'postAuthentication';
    case 'PreTokenGeneration':
      return 'preTokenGeneration';
    case 'DefineAuthChallenge':
      return 'defineAuthChallenge';
    case 'CreateAuthChallenge':
      return 'createAuthChallenge';
    case 'VerifyAuthChallengeResponse':
      return 'verifyAuthChallengeResponse';
    default:
      throw new Error(`Could not map the provided key: ${key}`);
  }
};

const getAuthTriggers = (
  lambdaConfig: LambdaConfigType,
  triggerSourceFiles: AuthTriggerConnectionSourceMap,
): Partial<Record<AuthTriggerEvents, Lambda>> => {
  return Object.keys(lambdaConfig).reduce((prev, key) => {
    const typedKey = key as keyof LambdaConfigType;
    prev[mappedLambdaConfigKey(typedKey)] = { source: triggerSourceFiles[typedKey] ?? '' };
    return prev;
  }, {} as Partial<Record<AuthTriggerEvents, Lambda>>);
};
/**
 * [getAuthDefinition] describes gen 1 auth resources in terms that can be used to generate Gen 2 code.
 */
export const getAuthDefinition = ({
  userPool,
  identityProviders,
  identityGroups,
  webClient,
  authTriggerConnections,
  guestLogin,
}: AuthSynthesizerOptions): AuthDefinition => {
  const loginWith: any = { email: true };
  const mapIdentityProvider = {
    [IdentityProviderTypeType.Google]: 'googleLogin',
    [IdentityProviderTypeType.SignInWithApple]: 'appleLogin',
    [IdentityProviderTypeType.LoginWithAmazon]: 'amazonLogin',
    [IdentityProviderTypeType.Facebook]: 'facebookLogin',
  };
  const identityProviderSet = new Set(identityProviders?.map((idp) => idp.ProviderType));
  for (const provider of identityProviderSet) {
    const loginWithProperty = mapIdentityProvider[provider as keyof typeof mapIdentityProvider];
    if (loginWithProperty != undefined) {
      loginWith[loginWithProperty] = true;
    }
  }
  if (userPool.UsernameAttributes?.includes('phone_number')) {
    loginWith.phone = true;
  }
  if (userPool.EmailVerificationMessage || userPool.EmailVerificationSubject) {
    loginWith.emailOptions = getEmailConfig(userPool);
  }
  if (webClient?.CallbackURLs) {
    loginWith.callbackURLs = webClient?.CallbackURLs;
  }
  if (webClient?.LogoutURLs) {
    loginWith.logoutURLs = webClient?.LogoutURLs;
  }

  const userPoolOverrides = getPasswordPolicyOverrides(userPool.Policies?.PasswordPolicy ?? {});
  return {
    loginOptions: loginWith,
    mfa: getMfaConfiguration(userPool.MfaConfiguration),
    userAttributes: getUserAttributes(userPool.SchemaAttributes),
    groups: getGroups(identityGroups),
    userPoolOverrides,
    lambdaTriggers: getAuthTriggers(userPool.LambdaConfig ?? {}, authTriggerConnections ?? {}),
    guestLogin,
    oAuthFlows: webClient?.AllowedOAuthFlows,
  };
};
