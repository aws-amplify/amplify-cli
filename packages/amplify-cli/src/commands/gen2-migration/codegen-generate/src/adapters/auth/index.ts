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

/**
 * Converts Cognito User Pool password policy settings to Gen 2 policy overrides format
 *
 * Maps Gen 1 password policy keys to Gen 2 CloudFormation override paths.
 * This enables preserving custom password requirements during migration.
 *
 * @example
 * Input: { MinimumLength: 10, RequireUppercase: true }
 * Output: { 'Policies.PasswordPolicy.MinimumLength': 10, 'Policies.PasswordPolicy.RequireUppercase': true }
 *
 * @param passwordPolicy - Gen 1 Cognito password policy configuration
 * @returns Gen 2 policy overrides with CloudFormation paths
 */
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

/**
 * Extracts User Pool configuration overrides needed for Gen 2 migration
 *
 * Combines password policy overrides with username attribute settings.
 * These overrides ensure Gen 2 maintains the same auth behavior as Gen 1.
 *
 * @param userPool - Cognito User Pool configuration from AWS
 * @returns Combined policy overrides for Gen 2 auth resource
 */
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

/**
 * Converts Cognito MFA settings to Gen 2 multifactor configuration
 *
 * Maps Gen 1 MFA modes (ON/OPTIONAL/OFF) to Gen 2 format and determines
 * which MFA methods (SMS, TOTP) are enabled based on User Pool configuration.
 *
 * @param mfaConfig - User Pool MFA enforcement mode from Cognito
 * @param totpConfig - TOTP (Time-based One-Time Password) configuration
 * @returns Gen 2 multifactor authentication configuration
 */
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

/**
 * Extracts custom email verification settings from User Pool
 *
 * Preserves custom email verification messages and subjects that were
 * configured in Gen 1 for use in Gen 2 email verification flows.
 *
 * @param userPool - Cognito User Pool configuration
 * @returns Email verification message configuration
 */
const getEmailConfig = (userPool: UserPoolType): EmailOptions => {
  return {
    emailVerificationBody: userPool.EmailVerificationMessage ?? '',
    emailVerificationSubject: userPool.EmailVerificationSubject ?? '',
  };
};

/**
 * Processes Cognito User Pool schema to extract standard user attributes
 *
 * Maps Cognito attribute names (e.g., 'family_name') to Gen 2 attribute names
 * (e.g., 'familyName') and preserves required/mutable settings for migration.
 *
 * Only processes attributes that are both required and in the mapping table.
 *
 * @param signupAttributes - User Pool schema attributes from Cognito
 * @param mappedUserAttributeName - Mapping from Cognito names to Gen 2 names
 * @returns Standard attributes configuration for Gen 2
 */
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

/**
 * Extracts custom user attributes from User Pool schema
 *
 * Processes attributes with 'custom:' prefix and preserves their validation
 * constraints (string length limits, number ranges) for Gen 2 migration.
 *
 * @example
 * Input: custom:department with StringConstraints { MinLength: 2, MaxLength: 50 }
 * Output: { 'custom:department': { mutable: true, dataType: 'String', minLen: 2, maxLen: 50 } }
 *
 * @param signupAttributes - User Pool schema attributes from Cognito
 * @returns Custom attributes configuration with validation constraints
 */
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

/**
 * Extracts and sorts User Pool groups by precedence
 *
 * Processes Cognito User Pool groups and sorts them by precedence value
 * (lower numbers = higher precedence). Only includes groups with defined precedence.
 *
 * @param identityGroups - User Pool groups from Cognito
 * @returns Sorted array of group names by precedence
 */
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
 * Filters OAuth scopes to only include Cognito-supported scopes
 *
 * CRITICAL LIMITATION: This function only processes global scopes from the User Pool Client
 * and loses provider-specific scope information. This is where the scope migration issue occurs.
 *
 * Supported Cognito scopes:
 * - 'phone': Access to phone number
 * - 'email': Access to email address
 * - 'openid': OpenID Connect identity token
 * - 'profile': Access to profile information
 * - 'aws.cognito.signin.user.admin': Admin-level user access
 *
 * @param scopes - Raw OAuth scopes from User Pool Client (global scopes)
 * @returns Filtered array of valid Cognito scopes
 */
const getScopes = (scopes: string[]): Scope[] => {
  return scopes.filter((scope): scope is Scope => ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'].includes(scope));
};

/**
 * Extracts provider-specific OAuth scopes from Identity Provider details
 *
 * Parses the authorized_scopes field from ProviderDetails to get the actual
 * scopes that each provider (Google, Facebook, etc.) was configured with.
 * This preserves provider-specific scope information that was lost in the global approach.
 *
 * @param providerDetails - Raw provider configuration from Cognito Identity Provider
 * @returns Array of provider-specific OAuth scopes
 */
const getProviderSpecificScopes = (providerDetails: Record<string, string>): string[] => {
  // Different providers store scopes in different fields
  const scopeFields = ['authorized_scopes', 'scope', 'scopes'];

  for (const field of scopeFields) {
    if (providerDetails[field]) {
      // Scopes can be space-separated or comma-separated
      return providerDetails[field].split(/[\s,]+/).filter((scope) => scope.length > 0);
    }
  }

  return [];
};

/**
 * Maps Cognito Lambda trigger names to Gen 2 auth trigger event names
 *
 * Converts Gen 1 Cognito trigger naming convention to Gen 2 camelCase format.
 * This ensures Lambda triggers are properly migrated with correct event names.
 *
 * @param key - Cognito Lambda trigger name (e.g., 'PreSignUp')
 * @returns Gen 2 auth trigger event name (e.g., 'preSignUp')
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

/**
 * Processes Cognito Lambda triggers for Gen 2 migration
 *
 * Maps Gen 1 Lambda trigger configurations to Gen 2 format, including
 * source file paths for each trigger function. Skips deprecated trigger
 * configurations like PreTokenGenerationConfig.
 *
 * @param lambdaConfig - User Pool Lambda trigger configuration from Cognito
 * @param triggerSourceFiles - Mapping of trigger types to source file paths
 * @returns Gen 2 Lambda trigger configuration with source paths
 */
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

/**
 * Filters and maps OAuth provider attribute mappings to Gen 2 format
 *
 * Takes attribute mappings from OAuth providers (Google, Facebook, etc.) and
 * converts them from Cognito attribute names to Gen 2 attribute names.
 * Only includes attributes that are supported in the mapping table.
 *
 * @example
 * Input: { 'family_name': 'last_name', 'given_name': 'first_name' }
 * Output: { 'familyName': 'last_name', 'givenName': 'first_name' }
 *
 * @param attributeMapping - Raw attribute mapping from OAuth provider
 * @param mappedUserAttributeName - Cognito to Gen 2 attribute name mapping
 * @returns Filtered and mapped attribute configuration
 */
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
 * MAIN FUNCTION: Converts Gen 1 Cognito auth configuration to Gen 2 format
 *
 * This is the primary data processing function that takes raw AWS Cognito configuration
 * and transforms it into a Gen 2 AuthDefinition that can be used for code generation.
 *
 * DATA FLOW:
 * 1. Receives AWS API responses (User Pool, Identity Providers, etc.)
 * 2. Processes provider configurations and sets login flags
 * 3. Extracts provider details and attribute mappings
 * 4. Applies global OAuth scopes from User Pool Client (LIMITATION: loses provider-specific scopes)
 * 5. Combines all configurations into Gen 2 format
 *
 * CRITICAL LIMITATION: Currently applies global OAuth scopes to all providers,
 * losing provider-specific scope information that exists in individual Identity Provider configs.
 *
 * @param options - Complete Cognito auth configuration from AWS APIs
 * @returns Gen 2 auth definition ready for code generation
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
  // Mapping table: Cognito attribute names → Gen 2 attribute names
  // Used to convert OAuth provider attribute mappings to Gen 2 format
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

  // Initialize login configuration with email enabled by default
  const loginWith: LoginOptions = { email: true };

  // Mapping table: Cognito provider types → [loginFlag, attributesFlag]
  // Used to set provider-specific flags in loginWith configuration
  const mapIdentityProvider = {
    [IdentityProviderTypeType.Google]: ['googleLogin', 'googleAttributes'],
    [IdentityProviderTypeType.SignInWithApple]: ['appleLogin', 'appleAttributes'],
    [IdentityProviderTypeType.LoginWithAmazon]: ['amazonLogin', 'amazonAttributes'],
    [IdentityProviderTypeType.Facebook]: ['facebookLogin', 'facebookAttributes'],
  };

  // STEP 1: Process basic provider list to set login flags
  // Sets googleLogin: true, facebookLogin: true, etc. based on configured providers
  if (identityProviders !== undefined) {
    identityProviders.forEach((provider) => {
      const loginWithProperty = mapIdentityProvider[provider?.ProviderType as keyof typeof mapIdentityProvider];
      if (loginWithProperty !== undefined) {
        const loginProperty = loginWithProperty[0];
        (loginWith[loginProperty as keyof LoginOptions] as boolean) = true;
      }
    });
  }

  // STEP 2: Process detailed provider configurations
  // Extracts OIDC/SAML settings and attribute mappings for each provider
  // LIMITATION: Provider-specific scopes are available in ProviderDetails but NOT extracted
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
        // Handle standard OAuth providers (Google, Facebook, Amazon, Apple)
        if (AttributeMapping) {
          const attributeOption = mapIdentityProvider[provider?.ProviderType as keyof typeof mapIdentityProvider][1];
          loginWith[attributeOption] = filterAttributeMapping(AttributeMapping, mappedUserAttributeName);
        }

        // EXTRACT PROVIDER-SPECIFIC SCOPES
        if (ProviderDetails) {
          const providerScopes = getProviderSpecificScopes(ProviderDetails);
          if (providerScopes.length > 0) {
            // Map provider type to scope property name
            const scopePropertyMap = {
              [IdentityProviderTypeType.Google]: 'googleScopes',
              [IdentityProviderTypeType.Facebook]: 'facebookScopes',
              [IdentityProviderTypeType.LoginWithAmazon]: 'amazonScopes',
              [IdentityProviderTypeType.SignInWithApple]: 'appleScopes',
            };

            const scopeProperty = scopePropertyMap[ProviderType as keyof typeof scopePropertyMap];
            if (scopeProperty) {
              // Filter to only valid Cognito scopes and map Facebook's public_profile to profile
              const mappedScopes = providerScopes
                .map((scope) => {
                  if (scope === 'public_profile') return 'profile';
                  return scope;
                })
                .filter((scope) => ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'].includes(scope));

              (loginWith as any)[scopeProperty] = mappedScopes;
            }
          }
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
