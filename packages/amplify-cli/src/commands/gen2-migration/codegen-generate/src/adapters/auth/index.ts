import {
  Lambda,
  AuthDefinition,
  EmailOptions,
  PasswordPolicyPath,
  AuthTriggerEvents,
  MultifactorOptions,
  StandardAttributes,
  StandardAttribute,
  CustomAttribute,
  CustomAttributes,
  Attribute,
  PolicyOverrides,
  SamlOptions,
  OidcOptions,
  LoginOptions,
  Scope,
  AttributeMappingRule,
  ReferenceAuth,
} from '../../core/migration-pipeline';
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
  IdentityProviderType,
  SoftwareTokenMfaConfigType,
} from '@aws-sdk/client-cognito-identity-provider';

export interface AuthTriggerConnection {
  triggerType: keyof LambdaConfigType;
  lambdaFunctionName: string;
}

export type AuthTriggerConnectionSourceMap = Partial<Record<keyof LambdaConfigType, string>>;

export interface AuthSynthesizerOptions {
  userPool: UserPoolType;
  identityPoolName?: string;
  identityProviders?: ProviderDescription[];
  identityProvidersDetails?: IdentityProviderType[];
  identityGroups?: GroupType[];
  webClient?: UserPoolClientType;
  authTriggerConnections?: AuthTriggerConnectionSourceMap;
  referenceAuth?: ReferenceAuth;
  guestLogin?: boolean;
  mfaConfig?: UserPoolMfaType;
  totpConfig?: SoftwareTokenMfaConfigType;
  userPoolClient?: UserPoolClientType;
}

export const DEFAULT_PASSWORD_SETTINGS: PasswordPolicyType = {
  MinimumLength: 8,
  RequireLowercase: true,
  RequireUppercase: true,
  RequireNumbers: true,
  TemporaryPasswordValidityDays: 3,
};

const COGNITO_TRIGGERS_TO_SKIP = ['PreTokenGenerationConfig'];

const getPasswordPolicyOverrides = (passwordPolicy: Partial<PasswordPolicyType>): Partial<PolicyOverrides> => {
  const policyOverrides: Partial<PolicyOverrides> = {};
  const passwordOverridePath = (policyKey: keyof PasswordPolicyType): PasswordPolicyPath => `Policies.PasswordPolicy.${policyKey}`;
  for (const key of Object.keys(passwordPolicy)) {
    const typedKey: keyof PasswordPolicyType = key as keyof PasswordPolicyType;
    if (passwordPolicy[typedKey] !== undefined) {
      policyOverrides[passwordOverridePath(typedKey)] = passwordPolicy[typedKey];
    }
  }
  return policyOverrides;
};

const getUserPoolOverrides = (userPool: UserPoolType): Partial<PolicyOverrides> => {
  const userPoolOverrides: Partial<PolicyOverrides> = {};
  Object.assign(userPoolOverrides, getPasswordPolicyOverrides(userPool.Policies?.PasswordPolicy ?? {}));
  if (userPool.UsernameAttributes === undefined || userPool.UsernameAttributes.length === 0) {
    userPoolOverrides.usernameAttributes = undefined;
  } else {
    userPoolOverrides.usernameAttributes = userPool.UsernameAttributes;
  }
  return userPoolOverrides;
};

const getMfaConfiguration = (mfaConfig?: UserPoolMfaType, totpConfig?: SoftwareTokenMfaConfigType): MultifactorOptions => {
  const multifactor: MultifactorOptions = {
    mode: 'OFF',
  };
  if (mfaConfig === 'ON') {
    multifactor.mode = 'REQUIRED';
    multifactor.sms = true;
    totpConfig?.Enabled ? (multifactor.totp = true) : (multifactor.totp = false);
  } else if (mfaConfig === 'OPTIONAL') {
    multifactor.mode = 'OPTIONAL';
    multifactor.sms = true;
    totpConfig?.Enabled ? (multifactor.totp = true) : (multifactor.totp = false);
  }
  return multifactor;
};

const getEmailConfig = (userPool: UserPoolType): EmailOptions => {
  return {
    emailVerificationBody: userPool.EmailVerificationMessage ?? '',
    emailVerificationSubject: userPool.EmailVerificationSubject ?? '',
  };
};

const getStandardUserAttributes = (
  signupAttributes: SchemaAttributeType[] | undefined,
  mappedUserAttributeName: Record<string, string>,
): StandardAttributes => {
  return (
    signupAttributes?.reduce((standardAttributes: StandardAttributes, attribute: SchemaAttributeType) => {
      const standardAttribute: StandardAttribute = {
        required: attribute.Required,
        mutable: attribute.Mutable,
      };
      if (attribute.Name !== undefined && attribute.Name in mappedUserAttributeName && attribute.Required) {
        return {
          ...standardAttributes,
          [mappedUserAttributeName[attribute.Name as keyof typeof mappedUserAttributeName] as Attribute]: standardAttribute,
        };
      }
      return standardAttributes;
    }, {} as StandardAttributes) || {}
  );
};

const getCustomUserAttributes = (signupAttributes: SchemaAttributeType[] | undefined): CustomAttributes => {
  return (
    signupAttributes?.reduce((customAttributes: CustomAttributes, attribute: SchemaAttributeType) => {
      if (attribute.Name !== undefined && attribute.Name.startsWith('custom:')) {
        const customAttribute: CustomAttribute = {
          mutable: attribute.Mutable,
          dataType: attribute.AttributeDataType,
        };

        if (attribute.NumberAttributeConstraints && Object.keys(attribute.NumberAttributeConstraints).length > 0) {
          customAttribute.min = Number(attribute.NumberAttributeConstraints.MinValue);
          customAttribute.max = Number(attribute.NumberAttributeConstraints.MaxValue);
        } else if (attribute.StringAttributeConstraints && Object.keys(attribute.StringAttributeConstraints).length > 0) {
          customAttribute.minLen = Number(attribute.StringAttributeConstraints.MinLength);
          customAttribute.maxLen = Number(attribute.StringAttributeConstraints.MaxLength);
        }
        return {
          ...customAttributes,
          [attribute.Name]: customAttribute,
        };
      }
      return customAttributes;
    }, {} as CustomAttributes) || {}
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

const getScopes = (scopes: string[]): Scope[] => {
  return scopes.filter((scope): scope is Scope => ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'].includes(scope));
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
  return (
    Object.keys(lambdaConfig)
      // There is PreTokenGenerationConfig that is duplicated, but is of a different format. Cognito introduced this at a later stage.
      // We look for PreTokenGeneration which is maintained for legacy reasons and is always populated.
      .filter((triggerName) => !COGNITO_TRIGGERS_TO_SKIP.includes(triggerName))
      .reduce((prev, key) => {
        const typedKey = key as keyof LambdaConfigType;
        prev[mappedLambdaConfigKey(typedKey)] = { source: triggerSourceFiles[typedKey] ?? '' };
        return prev;
      }, {} as Partial<Record<AuthTriggerEvents, Lambda>>)
  );
};

function filterAttributeMapping(
  attributeMapping: Record<string, string>,
  mappedUserAttributeName: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attributeMapping)
      .filter(([key]) => Object.keys(mappedUserAttributeName).includes(key))
      .map(([key, value]) => [mappedUserAttributeName[key as keyof typeof mappedUserAttributeName], value]),
  );
}

/**
 * [getAuthDefinition] describes gen 1 auth resources in terms that can be used to generate Gen 2 code.
 */
export const getAuthDefinition = ({
  userPool,
  identityPoolName,
  identityProviders,
  identityProvidersDetails,
  identityGroups,
  webClient,
  authTriggerConnections,
  guestLogin,
  referenceAuth,
  mfaConfig,
  totpConfig,
  userPoolClient,
}: AuthSynthesizerOptions): AuthDefinition => {
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

  const loginWith: LoginOptions = { email: true };
  const mapIdentityProvider = {
    [IdentityProviderTypeType.Google]: ['googleLogin', 'googleAttributes'],
    [IdentityProviderTypeType.SignInWithApple]: ['appleLogin', 'appleAttributes'],
    [IdentityProviderTypeType.LoginWithAmazon]: ['amazonLogin', 'amazonAttributes'],
    [IdentityProviderTypeType.Facebook]: ['facebookLogin', 'facebookAttributes'],
  };

  if (identityProviders !== undefined) {
    identityProviders.forEach((provider) => {
      const loginWithProperty = mapIdentityProvider[provider?.ProviderType as keyof typeof mapIdentityProvider];
      if (loginWithProperty !== undefined) {
        const loginProperty = loginWithProperty[0];
        (loginWith[loginProperty as keyof LoginOptions] as boolean) = true;
      }
    });
  }

  if (identityProvidersDetails) {
    const oidcOptions: OidcOptions[] = [];
    let samlOptions: SamlOptions | undefined;

    for (const provider of identityProvidersDetails) {
      const { ProviderType, ProviderName, ProviderDetails, AttributeMapping } = provider;

      if (ProviderType === IdentityProviderTypeType.OIDC && ProviderDetails) {
        const { oidc_issuer, authorize_url, token_url, attributes_url, jwks_uri } = ProviderDetails;
        const oidcOption: OidcOptions = {
          issuerUrl: oidc_issuer,
        };
        if (ProviderName) oidcOption.name = ProviderName;
        if (authorize_url && token_url && attributes_url && jwks_uri) {
          oidcOption.endpoints = {
            authorization: authorize_url,
            token: token_url,
            userInfo: attributes_url,
            jwksUri: jwks_uri,
          };
        }
        if (AttributeMapping)
          oidcOption.attributeMapping = filterAttributeMapping(AttributeMapping, mappedUserAttributeName) as AttributeMappingRule;
        oidcOptions.push(oidcOption);
      } else if (ProviderType === IdentityProviderTypeType.SAML && ProviderDetails) {
        const { metadataURL, metadataContent } = ProviderDetails;
        samlOptions = {
          metadata: {
            metadataContent: metadataURL || metadataContent,
            metadataType: metadataURL ? 'URL' : 'FILE',
          },
        };
        if (ProviderName) samlOptions.name = ProviderName;
        if (AttributeMapping)
          samlOptions.attributeMapping = filterAttributeMapping(AttributeMapping, mappedUserAttributeName) as AttributeMappingRule;
      } else {
        if (AttributeMapping) {
          const attributeOption = mapIdentityProvider[provider?.ProviderType as keyof typeof mapIdentityProvider][1];
          loginWith[attributeOption] = filterAttributeMapping(AttributeMapping, mappedUserAttributeName);
        }
      }
    }
    loginWith.oidcLogin = oidcOptions;
    loginWith.samlLogin = samlOptions;
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
  if (webClient?.AllowedOAuthScopes) {
    loginWith.scopes = getScopes(webClient?.AllowedOAuthScopes);
  }

  const userPoolOverrides = getUserPoolOverrides(userPool);
  return {
    loginOptions: loginWith,
    mfa: getMfaConfiguration(mfaConfig, totpConfig),
    standardUserAttributes: getStandardUserAttributes(userPool.SchemaAttributes, mappedUserAttributeName),
    customUserAttributes: getCustomUserAttributes(userPool.SchemaAttributes),
    groups: getGroups(identityGroups),
    userPoolOverrides,
    lambdaTriggers: getAuthTriggers(userPool.LambdaConfig ?? {}, authTriggerConnections ?? {}),
    guestLogin,
    identityPoolName,
    oAuthFlows: webClient?.AllowedOAuthFlows,
    readAttributes: webClient?.ReadAttributes,
    writeAttributes: webClient?.WriteAttributes,
    referenceAuth,
    userPoolClient,
  };
};
