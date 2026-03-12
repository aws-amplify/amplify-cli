import ts, { PropertyAssignment } from 'typescript';
import {
  GroupType,
  IdentityProviderType,
  IdentityProviderTypeType,
  PasswordPolicyType,
  SchemaAttributeType,
  UserPoolClientType,
  UserPoolType,
} from '@aws-sdk/client-cognito-identity-provider';
import { IdentityPool } from '@aws-sdk/client-cognito-identity';
import { GetUserPoolMfaConfigResponse } from '@aws-sdk/client-cognito-identity-provider';
import { renderResourceTsFile } from '../../resource';

/**
 * A registered auth trigger — contributed by the function generator.
 */
export interface AuthTrigger {
  readonly event: AuthTriggerEvent;
  readonly resourceName: string;
}

/**
 * OAuth 2.0 scopes supported by Cognito User Pools.
 */
export type Scope = 'phone' | 'email' | 'openid' | 'profile' | 'aws.cognito.signin.user.admin';

/**
 * Cognito User Pool Lambda trigger event types.
 */
export type AuthTriggerEvent =
  | 'createAuthChallenge'
  | 'customMessage'
  | 'defineAuthChallenge'
  | 'postAuthentication'
  | 'postConfirmation'
  | 'preAuthentication'
  | 'preSignUp'
  | 'preTokenGeneration'
  | 'userMigration'
  | 'verifyAuthChallengeResponse';

/**
 * Auth access permissions for a Lambda function.
 */
export interface AuthPermissions {
  readonly manageUsers?: boolean;
  readonly manageGroups?: boolean;
  readonly manageGroupMembership?: boolean;
  readonly manageUserDevices?: boolean;
  readonly managePasswordRecovery?: boolean;
  readonly addUserToGroup?: boolean;
  readonly createUser?: boolean;
  readonly deleteUser?: boolean;
  readonly deleteUserAttributes?: boolean;
  readonly disableUser?: boolean;
  readonly enableUser?: boolean;
  readonly forgetDevice?: boolean;
  readonly getDevice?: boolean;
  readonly getUser?: boolean;
  readonly listUsers?: boolean;
  readonly listDevices?: boolean;
  readonly listGroupsForUser?: boolean;
  readonly listUsersInGroup?: boolean;
  readonly listGroups?: boolean;
  readonly removeUserFromGroup?: boolean;
  readonly resetUserPassword?: boolean;
  readonly setUserMfaPreference?: boolean;
  readonly setUserPassword?: boolean;
  readonly setUserSettings?: boolean;
  readonly updateDeviceStatus?: boolean;
  readonly updateUserAttributes?: boolean;
}

/**
 * Minimal function info needed by the auth renderer to emit access rules.
 */
export interface FunctionAccess {
  /**
   * The Amplify resource name.
   */
  readonly resourceName: string;

  /**
   * Auth access permissions for this function.
   */
  readonly permissions: AuthPermissions;
}

/**
 * Raw SDK inputs the renderer needs to produce auth/resource.ts.
 */
export interface AuthRenderOptions {
  readonly userPool: UserPoolType;
  readonly identityPool?: IdentityPool;
  readonly identityProviders?: readonly IdentityProviderType[];
  readonly identityGroups?: readonly GroupType[];
  readonly webClient?: UserPoolClientType;
  readonly triggers?: readonly AuthTrigger[];
  readonly mfaConfig?: GetUserPoolMfaConfigResponse;
  readonly userPoolClient?: UserPoolClientType;
  readonly access?: readonly FunctionAccess[];
}

// TypeScript AST factory for creating nodes
const factory = ts.factory;

// Secret management identifier for Gen 2
const secretIdentifier = factory.createIdentifier('secret');

// Social provider secret key constants
const googleClientID = 'GOOGLE_CLIENT_ID';
const googleClientSecret = 'GOOGLE_CLIENT_SECRET';
const amazonClientID = 'LOGINWITHAMAZON_CLIENT_ID';
const amazonClientSecret = 'LOGINWITHAMAZON_CLIENT_SECRET';
const facebookClientID = 'FACEBOOK_CLIENT_ID';
const facebookClientSecret = 'FACEBOOK_CLIENT_SECRET';
const appleClientID = 'SIWA_CLIENT_ID';
const appleKeyId = 'SIWA_KEY_ID';
const applePrivateKey = 'SIWA_PRIVATE_KEY';
const appleTeamID = 'SIWA_TEAM_ID';
const oidcClientID = 'OIDC_CLIENT_ID';
const oidcClientSecret = 'OIDC_CLIENT_SECRET';

const VALID_SCOPES: readonly string[] = ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'];

const MAPPED_USER_ATTRIBUTE_NAME: Record<string, string> = {
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

const MAP_IDENTITY_PROVIDER: Record<string, [string, string]> = {
  [IdentityProviderTypeType.Google]: ['googleLogin', 'googleAttributes'],
  [IdentityProviderTypeType.SignInWithApple]: ['appleLogin', 'appleAttributes'],
  [IdentityProviderTypeType.LoginWithAmazon]: ['amazonLogin', 'amazonAttributes'],
  [IdentityProviderTypeType.Facebook]: ['facebookLogin', 'facebookAttributes'],
};

/**
 * Creates a TypeScript AST property assignment for auth Lambda triggers.
 */
function createTriggersProperty(triggers: readonly AuthTrigger[]): PropertyAssignment {
  return factory.createPropertyAssignment(
    factory.createIdentifier('triggers'),
    factory.createObjectLiteralExpression(
      triggers.map((t) => factory.createPropertyAssignment(factory.createIdentifier(t.event), factory.createIdentifier(t.resourceName))),
      true,
    ),
  );
}

/**
 * Renders a defineAuth() resource.ts file from Gen1 Cognito configuration.
 * Pure — no AWS calls, no side effects.
 */
export class AuthRenderer {
  /**
   * Produces the complete TypeScript AST for auth/resource.ts.
   */
  public render(options: AuthRenderOptions): ts.NodeArray<ts.Node> {
    const namedImports: { [importedPackageName: string]: Set<string> } = { '@aws-amplify/backend': new Set() };
    return this.renderStandardAuth(options, namedImports);
  }

  private renderStandardAuth(options: AuthRenderOptions, namedImports: Record<string, Set<string>>): ts.NodeArray<ts.Node> {
    namedImports['@aws-amplify/backend'].add('defineAuth');
    const defineAuthProperties: Array<PropertyAssignment> = [];

    const loginFlags = AuthRenderer.deriveLoginFlags(options.identityProviders);
    const hasExternalProviders =
      loginFlags.googleLogin ||
      loginFlags.amazonLogin ||
      loginFlags.appleLogin ||
      loginFlags.facebookLogin ||
      (options.identityProviders ?? []).some((p) => p.ProviderType === IdentityProviderTypeType.OIDC) ||
      (options.identityProviders ?? []).some((p) => p.ProviderType === IdentityProviderTypeType.SAML);

    if (hasExternalProviders) {
      namedImports['@aws-amplify/backend'].add('secret');
    }

    defineAuthProperties.push(this.createLogInWithPropertyAssignment(options, loginFlags));

    const standardAttributes = AuthRenderer.deriveStandardUserAttributes(options.userPool.SchemaAttributes);
    const customAttributes = AuthRenderer.deriveCustomUserAttributes(options.userPool.SchemaAttributes);
    const hasStandard = Object.keys(standardAttributes).length > 0;
    const hasCustom = Object.keys(customAttributes).length > 0;

    if (hasStandard || hasCustom) {
      defineAuthProperties.push(
        this.createUserAttributeAssignments(hasStandard ? standardAttributes : undefined, hasCustom ? customAttributes : undefined),
      );
    }

    const groups = AuthRenderer.deriveGroups(options.identityGroups);
    if (groups.length > 0) {
      defineAuthProperties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('groups'),
          factory.createArrayLiteralExpression(groups.map((g) => factory.createStringLiteral(g))),
        ),
      );
    }

    this.addLambdaTriggers(options.triggers ?? [], defineAuthProperties, namedImports);

    const mfa = AuthRenderer.deriveMfaConfig(options.mfaConfig);
    this.addMfaConfig(mfa, defineAuthProperties);

    this.addFunctionAccess(options.access, defineAuthProperties, namedImports);

    return renderResourceTsFile({
      exportedVariableName: factory.createIdentifier('auth'),
      functionCallParameter: factory.createObjectLiteralExpression(defineAuthProperties, true),
      additionalImportedBackendIdentifiers: namedImports,
      backendFunctionConstruct: 'defineAuth',
    });
  }

  // ── Derivation logic (moved from getAuthDefinition) ──────────────

  /**
   * Derives social login flags from identity provider descriptions.
   */
  private static deriveLoginFlags(providers?: readonly IdentityProviderType[]): Record<string, boolean> {
    const flags: Record<string, boolean> = {
      googleLogin: false,
      amazonLogin: false,
      appleLogin: false,
      facebookLogin: false,
    };
    if (!providers) return flags;

    for (const provider of providers) {
      const mapping = MAP_IDENTITY_PROVIDER[provider?.ProviderType as keyof typeof MAP_IDENTITY_PROVIDER];
      if (mapping) {
        flags[mapping[0]] = true;
      }
    }
    return flags;
  }

  /**
   * Parses OIDC/SAML providers, attribute mappings, and scopes from
   * identity provider details.
   */
  private static deriveExternalProviders(details?: readonly IdentityProviderType[]): {
    readonly oidcProviders: readonly OidcProviderConfig[];
    readonly samlProvider: SamlProviderConfig | undefined;
    readonly attributeMappings: Readonly<Record<string, Record<string, string>>>;
    readonly providerScopes: Readonly<Record<string, readonly string[]>>;
  } {
    const oidcProviders: OidcProviderConfig[] = [];
    let samlProvider: SamlProviderConfig | undefined;
    const attributeMappings: Record<string, Record<string, string>> = {};
    const providerScopes: Record<string, string[]> = {};

    if (!details) {
      return { oidcProviders, samlProvider, attributeMappings, providerScopes };
    }

    for (const provider of details) {
      const { ProviderType, ProviderName, ProviderDetails, AttributeMapping } = provider;

      if (ProviderType === IdentityProviderTypeType.OIDC && ProviderDetails) {
        const { oidc_issuer, authorize_url, token_url, attributes_url, jwks_uri } = ProviderDetails;
        const endpoints =
          authorize_url && token_url && attributes_url && jwks_uri
            ? { authorization: authorize_url, token: token_url, userInfo: attributes_url, jwksUri: jwks_uri }
            : undefined;
        oidcProviders.push({
          issuerUrl: oidc_issuer,
          name: ProviderName,
          endpoints,
          attributeMapping: AttributeMapping ? AuthRenderer.filterAttributeMapping(AttributeMapping) : undefined,
        });
      } else if (ProviderType === IdentityProviderTypeType.SAML && ProviderDetails) {
        const { metadataURL, metadataContent } = ProviderDetails;
        samlProvider = {
          metadata: {
            metadataContent: metadataURL || metadataContent,
            metadataType: metadataURL ? ('URL' as const) : ('FILE' as const),
          },
          name: ProviderName,
          attributeMapping: AttributeMapping ? AuthRenderer.filterAttributeMapping(AttributeMapping) : undefined,
        };
      } else {
        if (AttributeMapping) {
          const filteredMapping = AuthRenderer.filterAttributeMapping(AttributeMapping);
          const attributeProperty = MAP_IDENTITY_PROVIDER[provider?.ProviderType as keyof typeof MAP_IDENTITY_PROVIDER]?.[1];
          if (attributeProperty) {
            attributeMappings[attributeProperty] = filteredMapping;
          }
        }

        if (ProviderDetails) {
          const scopes = AuthRenderer.deriveProviderSpecificScopes(ProviderDetails);
          if (scopes.length > 0) {
            const mapped = scopes
              .map((scope) => (scope === 'public_profile' ? 'profile' : scope))
              .filter((scope) => VALID_SCOPES.includes(scope));
            if (mapped.length > 0 && ProviderType) {
              providerScopes[ProviderType] = mapped;
            }
          }
        }
      }
    }

    return { oidcProviders, samlProvider, attributeMappings, providerScopes };
  }

  /**
   * Derives MFA configuration from Cognito SDK types.
   */
  private static deriveMfaConfig(mfa?: GetUserPoolMfaConfigResponse): {
    readonly mode: string;
    readonly sms?: boolean;
    readonly totp?: boolean;
  } {
    if (mfa?.MfaConfiguration === 'ON') {
      return { mode: 'REQUIRED', sms: true, totp: mfa.SoftwareTokenMfaConfiguration?.Enabled ?? false };
    }
    if (mfa?.MfaConfiguration === 'OPTIONAL') {
      return { mode: 'OPTIONAL', sms: true, totp: mfa.SoftwareTokenMfaConfiguration?.Enabled ?? false };
    }
    return { mode: 'OFF' };
  }

  /**
   * Extracts standard user attributes from schema, keeping only required ones.
   */
  private static deriveStandardUserAttributes(
    schema?: readonly SchemaAttributeType[],
  ): Record<string, { readonly required?: boolean; readonly mutable?: boolean }> {
    if (!schema) return {};
    const result: Record<string, { readonly required?: boolean; readonly mutable?: boolean }> = {};
    for (const attribute of schema) {
      if (attribute.Name && attribute.Name in MAPPED_USER_ATTRIBUTE_NAME && attribute.Required) {
        result[MAPPED_USER_ATTRIBUTE_NAME[attribute.Name]] = {
          required: attribute.Required,
          mutable: attribute.Mutable,
        };
      }
    }
    return result;
  }

  /**
   * Extracts custom user attributes from schema.
   */
  private static deriveCustomUserAttributes(schema?: readonly SchemaAttributeType[]): Record<
    string,
    {
      readonly dataType?: string;
      readonly mutable?: boolean;
      readonly min?: number;
      readonly max?: number;
      readonly minLen?: number;
      readonly maxLen?: number;
    }
  > {
    if (!schema) return {};
    const result: Record<
      string,
      {
        readonly dataType?: string;
        readonly mutable?: boolean;
        readonly min?: number;
        readonly max?: number;
        readonly minLen?: number;
        readonly maxLen?: number;
      }
    > = {};
    for (const attribute of schema) {
      if (attribute.Name && attribute.Name.startsWith('custom:')) {
        const constraints =
          attribute.NumberAttributeConstraints && Object.keys(attribute.NumberAttributeConstraints).length > 0
            ? { min: Number(attribute.NumberAttributeConstraints.MinValue), max: Number(attribute.NumberAttributeConstraints.MaxValue) }
            : attribute.StringAttributeConstraints && Object.keys(attribute.StringAttributeConstraints).length > 0
            ? {
                minLen: Number(attribute.StringAttributeConstraints.MinLength),
                maxLen: Number(attribute.StringAttributeConstraints.MaxLength),
              }
            : {};

        result[attribute.Name] = {
          mutable: attribute.Mutable,
          dataType: attribute.AttributeDataType,
          ...constraints,
        };
      }
    }
    return result;
  }

  /**
   * Derives sorted group names from Cognito group types.
   */
  private static deriveGroups(groups?: readonly GroupType[]): readonly string[] {
    if (!groups || groups.length === 0) return [];
    return groups
      .filter((group) => group.Precedence !== undefined)
      .sort((a, b) => (a.Precedence || 0) - (b.Precedence || 0))
      .map((group) => group.GroupName)
      .filter((name): name is string => name !== undefined);
  }

  public static deriveUserPoolOverrides(userPool: UserPoolType): Record<string, string | boolean | number | string[] | undefined> {
    const overrides: Record<string, string | boolean | number | string[] | undefined> = {};
    const passwordPolicy = userPool.Policies?.PasswordPolicy ?? {};
    for (const key of Object.keys(passwordPolicy)) {
      const typedKey = key as keyof PasswordPolicyType;
      if (passwordPolicy[typedKey] !== undefined) {
        overrides[`Policies.PasswordPolicy.${typedKey}`] = passwordPolicy[typedKey];
      }
    }
    if (userPool.UsernameAttributes === undefined || userPool.UsernameAttributes.length === 0) {
      overrides.usernameAttributes = undefined;
    } else {
      overrides.usernameAttributes = userPool.UsernameAttributes;
    }
    return overrides;
  }

  /**
   * Extracts provider-specific scopes from provider details.
   */
  private static deriveProviderSpecificScopes(providerDetails: Record<string, string>): string[] {
    const scopeFields = ['authorized_scopes', 'scope', 'scopes'];
    for (const field of scopeFields) {
      if (providerDetails[field]) {
        return providerDetails[field].split(/[\s,]+/).filter((scope) => scope.length > 0);
      }
    }
    return [];
  }

  /**
   * Filters attribute mappings to only known standard attributes.
   */
  private static filterAttributeMapping(attributeMapping: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(attributeMapping)
        .filter(([key]) => Object.keys(MAPPED_USER_ATTRIBUTE_NAME).includes(key))
        .map(([key, value]) => [MAPPED_USER_ATTRIBUTE_NAME[key], value]),
    );
  }

  // ── AST rendering helpers ────────────────────────────────────────

  private addLambdaTriggers(
    triggers: readonly AuthTrigger[],
    properties: PropertyAssignment[],
    namedImports: Record<string, Set<string>>,
  ): void {
    if (triggers.length === 0) return;

    properties.push(createTriggersProperty(triggers));

    for (const trigger of triggers) {
      const importPath = `./${trigger.resourceName}/resource`;
      if (!namedImports[importPath]) {
        namedImports[importPath] = new Set();
      }
      namedImports[importPath].add(trigger.resourceName);
    }
  }

  private addMfaConfig(
    mfa: { readonly mode: string; readonly sms?: boolean; readonly totp?: boolean },
    properties: PropertyAssignment[],
  ): void {
    if (mfa.mode === 'OFF') {
      return;
    }

    const multifactorProperties = [
      factory.createPropertyAssignment(factory.createIdentifier('mode'), factory.createStringLiteral(mfa.mode)),
    ];

    if (mfa.totp !== undefined) {
      multifactorProperties.push(
        factory.createPropertyAssignment(factory.createIdentifier('totp'), mfa.totp ? factory.createTrue() : factory.createFalse()),
      );
    }

    if (mfa.sms !== undefined) {
      multifactorProperties.push(
        factory.createPropertyAssignment(factory.createIdentifier('sms'), mfa.sms ? factory.createTrue() : factory.createFalse()),
      );
    }

    properties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('multifactor'),
        factory.createObjectLiteralExpression(multifactorProperties, true),
      ),
    );
  }

  private addFunctionAccess(
    functions: readonly FunctionAccess[] | undefined,
    properties: PropertyAssignment[],
    namedImports: Record<string, Set<string>>,
  ): void {
    if (!functions || functions.length === 0) {
      return;
    }

    const functionsWithAuthAccess = functions.filter((func) => Object.keys(func.permissions).length > 0);
    if (functionsWithAuthAccess.length === 0) {
      return;
    }

    for (const func of functionsWithAuthAccess) {
      namedImports[`../function/${func.resourceName}/resource`] = new Set([func.resourceName]);
    }

    const accessRules: ts.Expression[] = [];

    for (const func of functionsWithAuthAccess) {
      for (const [permission, enabled] of Object.entries(func.permissions)) {
        if (enabled) {
          accessRules.push(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('allow'), factory.createIdentifier('resource')),
                  undefined,
                  [factory.createIdentifier(func.resourceName)],
                ),
                factory.createIdentifier('to'),
              ),
              undefined,
              [factory.createArrayLiteralExpression([factory.createStringLiteral(permission)])],
            ),
          );
        }
      }
    }

    if (accessRules.length > 0) {
      properties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('access'),
          factory.createArrowFunction(
            undefined,
            undefined,
            [
              factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('allow')),
              factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('_unused')),
            ],
            undefined,
            undefined,
            factory.createArrayLiteralExpression(accessRules, true),
          ),
        ),
      );
    }
  }

  private createLogInWithPropertyAssignment(options: AuthRenderOptions, loginFlags: Record<string, boolean>): PropertyAssignment {
    const logInWith = factory.createIdentifier('loginWith');
    const assignments: ts.ObjectLiteralElementLike[] = [];

    const emailOptions =
      options.userPool.EmailVerificationMessage || options.userPool.EmailVerificationSubject
        ? {
            emailVerificationBody: options.userPool.EmailVerificationMessage ?? '',
            emailVerificationSubject: options.userPool.EmailVerificationSubject ?? '',
          }
        : undefined;

    if (emailOptions) {
      assignments.push(factory.createPropertyAssignment(factory.createIdentifier('email'), this.createEmailDefinitionObject(emailOptions)));
    } else {
      assignments.push(factory.createPropertyAssignment(factory.createIdentifier('email'), factory.createTrue()));
    }

    if (options.userPool.UsernameAttributes?.includes('phone_number')) {
      assignments.push(factory.createPropertyAssignment(factory.createIdentifier('phone'), factory.createTrue()));
    }

    const externalProviders = AuthRenderer.deriveExternalProviders(options.identityProviders);
    const hasExternalProviders =
      loginFlags.googleLogin ||
      loginFlags.amazonLogin ||
      loginFlags.appleLogin ||
      loginFlags.facebookLogin ||
      externalProviders.oidcProviders.length > 0 ||
      externalProviders.samlProvider !== undefined;

    if (hasExternalProviders) {
      assignments.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('externalProviders'),
          this.createExternalProvidersExpression(
            loginFlags,
            externalProviders,
            options.webClient?.CallbackURLs,
            options.webClient?.LogoutURLs,
          ),
        ),
      );
    }

    return factory.createPropertyAssignment(logInWith, factory.createObjectLiteralExpression(assignments, true));
  }

  private createEmailDefinitionObject(emailOptions: {
    readonly emailVerificationBody: string;
    readonly emailVerificationSubject: string;
  }): ts.ObjectLiteralExpression {
    const emailDefinitionAssignments: ts.ObjectLiteralElementLike[] = [];

    if (emailOptions.emailVerificationSubject) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment('verificationEmailSubject', factory.createStringLiteral(emailOptions.emailVerificationSubject)),
      );
    }
    if (emailOptions.emailVerificationBody) {
      emailDefinitionAssignments.push(
        factory.createPropertyAssignment(
          'verificationEmailBody',
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            factory.createStringLiteral(emailOptions.emailVerificationBody),
          ),
        ),
      );
    }

    return factory.createObjectLiteralExpression(emailDefinitionAssignments, true);
  }

  private createExternalProvidersExpression(
    loginFlags: Record<string, boolean>,
    externalProviders: {
      readonly oidcProviders: readonly OidcProviderConfig[];
      readonly samlProvider: SamlProviderConfig | undefined;
      readonly attributeMappings: Readonly<Record<string, Record<string, string>>>;
      readonly providerScopes: Readonly<Record<string, readonly string[]>>;
    },
    callbackUrls?: readonly string[],
    logoutUrls?: readonly string[],
  ): ts.ObjectLiteralExpression {
    const providerAssignments: PropertyAssignment[] = [];

    if (loginFlags.googleLogin) {
      const googleConfig: Record<string, string> = {
        clientId: googleClientID,
        clientSecret: googleClientSecret,
      };
      const googleScopes = externalProviders.providerScopes[IdentityProviderTypeType.Google];
      if (googleScopes && googleScopes.length > 0) {
        googleConfig.scopes = googleScopes.join(' ');
      }
      providerAssignments.push(
        AuthRenderer.createProviderPropertyAssignment('google', googleConfig, externalProviders.attributeMappings.googleAttributes),
      );
    }

    if (loginFlags.appleLogin) {
      const appleConfig: Record<string, string> = {
        clientId: appleClientID,
        keyId: appleKeyId,
        privateKey: applePrivateKey,
        teamId: appleTeamID,
      };
      const appleScopes = externalProviders.providerScopes[IdentityProviderTypeType.SignInWithApple];
      if (appleScopes && appleScopes.length > 0) {
        appleConfig.scopes = appleScopes.join(' ');
      }
      providerAssignments.push(
        AuthRenderer.createProviderPropertyAssignment('signInWithApple', appleConfig, externalProviders.attributeMappings.appleAttributes),
      );
    }

    if (loginFlags.amazonLogin) {
      const amazonConfig: Record<string, string> = {
        clientId: amazonClientID,
        clientSecret: amazonClientSecret,
      };
      const amazonScopes = externalProviders.providerScopes[IdentityProviderTypeType.LoginWithAmazon];
      if (amazonScopes && amazonScopes.length > 0) {
        amazonConfig.scopes = amazonScopes.join(' ');
      }
      providerAssignments.push(
        AuthRenderer.createProviderPropertyAssignment(
          'loginWithAmazon',
          amazonConfig,
          externalProviders.attributeMappings.amazonAttributes,
        ),
      );
    }

    if (loginFlags.facebookLogin) {
      const facebookConfig: Record<string, string> = {
        clientId: facebookClientID,
        clientSecret: facebookClientSecret,
      };
      const facebookScopes = externalProviders.providerScopes[IdentityProviderTypeType.Facebook];
      if (facebookScopes && facebookScopes.length > 0) {
        facebookConfig.scopes = facebookScopes.join(' ');
      }
      providerAssignments.push(
        AuthRenderer.createProviderPropertyAssignment('facebook', facebookConfig, externalProviders.attributeMappings.facebookAttributes),
      );
    }

    if (externalProviders.samlProvider) {
      providerAssignments.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('saml'),
          factory.createObjectLiteralExpression(
            AuthRenderer.createOidcSamlPropertyAssignments(externalProviders.samlProvider as Record<string, unknown>),
            true,
          ),
        ),
      );
    }

    if (externalProviders.oidcProviders.length > 0) {
      providerAssignments.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('oidc'),
          factory.createArrayLiteralExpression(
            externalProviders.oidcProviders.map((oidc, index) =>
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier('clientId'),
                    factory.createCallExpression(secretIdentifier, undefined, [
                      factory.createStringLiteral(`${oidcClientID}_${index + 1}`),
                    ]),
                  ),
                  factory.createPropertyAssignment(
                    factory.createIdentifier('clientSecret'),
                    factory.createCallExpression(secretIdentifier, undefined, [
                      factory.createStringLiteral(`${oidcClientSecret}_${index + 1}`),
                    ]),
                  ),
                  ...AuthRenderer.createOidcSamlPropertyAssignments(oidc as Record<string, unknown>),
                ],
                true,
              ),
            ),
            true,
          ),
        ),
      );
    }

    const properties = [
      ...providerAssignments,
      factory.createPropertyAssignment(
        factory.createIdentifier('callbackUrls'),
        factory.createArrayLiteralExpression(callbackUrls?.map((url) => factory.createStringLiteral(url))),
      ),
      factory.createPropertyAssignment(
        factory.createIdentifier('logoutUrls'),
        factory.createArrayLiteralExpression(logoutUrls?.map((url) => factory.createStringLiteral(url))),
      ),
    ];

    return factory.createObjectLiteralExpression(properties, true);
  }

  private createUserAttributeAssignments(
    standardAttributes: Record<string, { readonly required?: boolean; readonly mutable?: boolean }> | undefined,
    customAttributes:
      | Record<
          string,
          {
            readonly dataType?: string;
            readonly mutable?: boolean;
            readonly min?: number;
            readonly max?: number;
            readonly minLen?: number;
            readonly maxLen?: number;
          }
        >
      | undefined,
  ): PropertyAssignment {
    const userAttributeIdentifier = factory.createIdentifier('userAttributes');
    const userAttributeProperties = [];

    if (standardAttributes !== undefined) {
      const standardAttributeProperties = Object.entries(standardAttributes).map(([key, value]) => {
        return factory.createPropertyAssignment(factory.createIdentifier(key), AuthRenderer.createAttributeDefinition(value));
      });
      userAttributeProperties.push(...standardAttributeProperties);
    }

    if (customAttributes !== undefined) {
      const customAttributeProperties = Object.entries(customAttributes)
        .map(([key, value]) => {
          if (value !== undefined) {
            return factory.createPropertyAssignment(factory.createStringLiteral(key), AuthRenderer.createAttributeDefinition(value));
          }
          return undefined;
        })
        .filter((property): property is ts.PropertyAssignment => property !== undefined);
      userAttributeProperties.push(...customAttributeProperties);
    }

    return factory.createPropertyAssignment(userAttributeIdentifier, factory.createObjectLiteralExpression(userAttributeProperties, true));
  }

  private static createAttributeDefinition(attribute: Record<string, string | boolean | number | undefined>): ts.ObjectLiteralExpression {
    const properties: ts.PropertyAssignment[] = [];

    for (const key of Object.keys(attribute)) {
      const value = attribute[key];

      if (typeof value === 'boolean') {
        properties.push(
          factory.createPropertyAssignment(factory.createIdentifier(key), value ? factory.createTrue() : factory.createFalse()),
        );
      } else if (typeof value === 'string') {
        properties.push(factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value)));
      } else if (typeof value === 'number') {
        properties.push(factory.createPropertyAssignment(factory.createIdentifier(key), factory.createNumericLiteral(value)));
      }
    }

    return factory.createObjectLiteralExpression(properties, true);
  }

  private static createProviderConfig(
    config: Record<string, string>,
    attributeMapping: Record<string, string> | undefined,
  ): ts.ObjectLiteralElementLike[] {
    const properties: ts.ObjectLiteralElementLike[] = [];

    Object.entries(config).forEach(([key, value]) => {
      if (key === 'scopes') {
        const scopeArray = value.split(' ').filter((scope) => scope.length > 0);
        properties.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('scopes'),
            factory.createArrayLiteralExpression(scopeArray.map((scope) => factory.createStringLiteral(scope))),
          ),
        );
      } else {
        properties.push(
          factory.createPropertyAssignment(
            factory.createIdentifier(key),
            factory.createCallExpression(secretIdentifier, undefined, [factory.createStringLiteral(value)]),
          ),
        );
      }
    });

    if (attributeMapping) {
      const mappingProperties: ts.ObjectLiteralElementLike[] = [];

      Object.entries(attributeMapping).forEach(([key, value]) =>
        mappingProperties.push(factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value))),
      );

      properties.push(
        factory.createPropertyAssignment(
          factory.createIdentifier('attributeMapping'),
          factory.createObjectLiteralExpression(mappingProperties, true),
        ),
      );
    }

    return properties;
  }

  private static createProviderPropertyAssignment(
    name: string,
    config: Record<string, string>,
    attributeMapping: Record<string, string> | undefined,
  ): PropertyAssignment {
    return factory.createPropertyAssignment(
      factory.createIdentifier(name),
      factory.createObjectLiteralExpression(AuthRenderer.createProviderConfig(config, attributeMapping), true),
    );
  }

  private static createOidcSamlPropertyAssignments(config: Record<string, unknown>): PropertyAssignment[] {
    return Object.entries(config).flatMap(([key, value]) => {
      if (typeof value === 'string') {
        return [factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value))];
      } else if (typeof value === 'object' && value !== null) {
        return [
          factory.createPropertyAssignment(
            factory.createIdentifier(key),
            factory.createObjectLiteralExpression(AuthRenderer.createOidcSamlPropertyAssignments(value as Record<string, unknown>), true),
          ),
        ];
      }
      return [];
    });
  }
}

/**
 * Internal OIDC provider config derived from IdentityProviderType.
 */
type OidcProviderConfig = {
  readonly issuerUrl: string;
  readonly name?: string;
  readonly endpoints?: {
    readonly authorization: string;
    readonly token: string;
    readonly userInfo: string;
    readonly jwksUri: string;
  };
  readonly attributeMapping?: Record<string, string>;
};

/**
 * Internal SAML provider config derived from IdentityProviderType.
 */
type SamlProviderConfig = {
  readonly metadata: {
    readonly metadataContent: string;
    readonly metadataType: 'URL' | 'FILE';
  };
  readonly name?: string;
  readonly attributeMapping?: Record<string, string>;
};
