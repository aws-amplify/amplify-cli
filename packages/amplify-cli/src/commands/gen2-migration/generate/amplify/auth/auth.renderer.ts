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
import { newLineIdentifier, TS } from '../../ts';
import { AUTH_RESOURCES_TO_RETAIN } from '../../../_common/resource-types';

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
  readonly createGroup?: boolean;
  readonly deleteGroup?: boolean;
  readonly getGroup?: boolean;
  readonly updateGroup?: boolean;
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
  readonly webClient: UserPoolClientType;
  readonly nativeClient: UserPoolClientType;
  readonly identityPool?: IdentityPool;
  readonly identityProviders?: readonly IdentityProviderType[];
  readonly identityGroups?: readonly GroupType[];
  readonly triggers?: readonly AuthTrigger[];
  readonly mfaConfig?: GetUserPoolMfaConfigResponse;
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
   * Produces the complete auth/resource.ts file including defineAuth(),
   * applyEscapeHatches(), Backend type import, and CDK imports.
   */
  public render(options: AuthRenderOptions): ts.NodeArray<ts.Node> {
    const namedImports: { [importedPackageName: string]: Set<string> } = { '@aws-amplify/backend': new Set() };
    const baseNodes = this.renderStandardAuth(options, namedImports);

    const additionalImportDeclarations = this.renderCdkImports(options);
    const backendTypeImport = this.renderBackendTypeImport();
    const applyEscapeHatchesDeclarations = this.renderApplyEscapeHatches(options);
    const postRefactorDeclaration = options.userPool.Domain ? this.renderPostRefactor(options) : undefined;

    const allNodes: ts.Node[] = [];
    let foundFirstNonImport = false;
    for (const node of baseNodes) {
      if (!foundFirstNonImport && ts.isImportDeclaration(node as ts.Node)) {
        allNodes.push(node);
      } else {
        if (!foundFirstNonImport) {
          for (const declaration of additionalImportDeclarations) {
            allNodes.push(declaration);
          }
          allNodes.push(backendTypeImport);
          foundFirstNonImport = true;
        }
        allNodes.push(node);
      }
    }
    if (!foundFirstNonImport) {
      for (const declaration of additionalImportDeclarations) {
        allNodes.push(declaration);
      }
      allNodes.push(backendTypeImport);
    }

    allNodes.push(newLineIdentifier);
    allNodes.push(applyEscapeHatchesDeclarations);
    if (postRefactorDeclaration) {
      allNodes.push(newLineIdentifier);
      allNodes.push(postRefactorDeclaration);
    }

    return factory.createNodeArray(allNodes as ts.Statement[]);
  }

  private renderBackendTypeImport(): ts.ImportDeclaration {
    return TS.typeImport('../backend', 'Backend');
  }

  private renderCdkImports(options: AuthRenderOptions): ts.ImportDeclaration[] {
    const additionalImports = this.buildAdditionalImports(options);
    const declarations: ts.ImportDeclaration[] = [];
    for (const [source, identifiers] of Object.entries(additionalImports)) {
      declarations.push(TS.namedImport(source, ...Array.from(identifiers)));
    }
    return declarations;
  }

  private renderApplyEscapeHatches(options: AuthRenderOptions): ts.FunctionDeclaration {
    const escapeHatchStatements = this.buildEscapeHatchStatements(options);
    return TS.exportedFunction('applyEscapeHatches', escapeHatchStatements);
  }

  private renderPostRefactor(options: AuthRenderOptions): ts.FunctionDeclaration {
    return TS.exportedFunction('postRefactor', this.buildDomainOverrideStatements(options.userPool.Domain));
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

    return TS.renderResourceTsFile({
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
    readonly attributeMappings: Readonly<Record<string, { standard: Record<string, string>; custom: Record<string, string> }>>;
    readonly providerScopes: Readonly<Record<string, readonly string[]>>;
  } {
    const oidcProviders: OidcProviderConfig[] = [];
    let samlProvider: SamlProviderConfig | undefined;
    const attributeMappings: Record<string, { standard: Record<string, string>; custom: Record<string, string> }> = {};
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
        const oidcMapping = AttributeMapping ? AuthRenderer.filterAttributeMapping(AttributeMapping) : undefined;
        oidcProviders.push({
          issuerUrl: oidc_issuer,
          name: ProviderName,
          endpoints,
          attributeMapping: oidcMapping ? { ...oidcMapping.standard, ...oidcMapping.custom } : undefined,
        });
      } else if (ProviderType === IdentityProviderTypeType.SAML && ProviderDetails) {
        const { metadataURL, metadataContent } = ProviderDetails;
        const samlMapping = AttributeMapping ? AuthRenderer.filterAttributeMapping(AttributeMapping) : undefined;
        samlProvider = {
          metadata: {
            metadataContent: metadataURL || metadataContent,
            metadataType: metadataURL ? ('URL' as const) : ('FILE' as const),
          },
          name: ProviderName,
          attributeMapping: samlMapping ? { ...samlMapping.standard, ...samlMapping.custom } : undefined,
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
            const mapped = scopes.filter((scope) => scope.length > 0);
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
   * Extracts standard user attributes from schema, keeping required ones
   * and any that appear in the app client read/write attribute lists.
   */
  private static deriveStandardUserAttributes(
    schema?: readonly SchemaAttributeType[],
  ): Record<string, { readonly required?: boolean; readonly mutable?: boolean }> {
    if (!schema) return {};
    const result: Record<string, { readonly required?: boolean; readonly mutable?: boolean }> = {};
    for (const attribute of schema) {
      // skip if the attribute is not a standard one (i.e custom:)
      if (!attribute.Name || !(attribute.Name in MAPPED_USER_ATTRIBUTE_NAME)) continue;

      // optional attributes are skipped because this gen2 property (userAttributes)
      // only maps to the required attributes.
      // https://github.com/aws-amplify/amplify-backend/blob/757e2ce01616ad0c24547c541f1be4d389fd408b/packages/auth-construct/src/types.ts#L599-L602
      // where do optional attributes go? unclear, this might be a gap we have, or it might be that Gen1 has no option to set optional attributes.
      if (!attribute.Required) continue;

      result[MAPPED_USER_ATTRIBUTE_NAME[attribute.Name]] = {
        required: attribute.Required,
        mutable: attribute.Mutable,
      };
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

  private static deriveUserPoolOverrides(userPool: UserPoolType): Record<string, string | boolean | number | string[] | undefined> {
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
    if (userPool.AliasAttributes !== undefined && userPool.AliasAttributes.length > 0) {
      overrides.aliasAttributes = userPool.AliasAttributes;
    }
    return overrides;
  }

  /**
   * Extracts provider-specific scopes from provider details.
   */
  private static deriveProviderSpecificScopes(providerDetails: Record<string, string>): string[] {
    const scopeFields = ['authorize_scopes', 'authorized_scopes', 'scope', 'scopes'];
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
  private static filterAttributeMapping(attributeMapping: Record<string, string>): {
    standard: Record<string, string>;
    custom: Record<string, string>;
  } {
    const standard: Record<string, string> = {};
    const custom: Record<string, string> = {};

    for (const [key, value] of Object.entries(attributeMapping)) {
      if (key in MAPPED_USER_ATTRIBUTE_NAME) {
        standard[MAPPED_USER_ATTRIBUTE_NAME[key]] = value;
      } else {
        custom[key] = value;
      }
    }

    return { standard, custom };
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
      const importPath = `../function/${trigger.resourceName}/resource`;
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
      // Skip adding import if the function is already imported (e.g., by addLambdaTriggers for auth triggers).
      const alreadyImported = Object.values(namedImports).some((names) => names.has(func.resourceName));
      if (!alreadyImported) {
        namedImports[`../function/${func.resourceName}/resource`] = new Set([func.resourceName]);
      }
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

  /**
   * Derives which login mechanisms (email, phone) the Gen1 user pool actually
   * uses, based on its sign-in configuration.
   *
   * Gen2 `defineAuth` maps `loginWith.email`/`loginWith.phone` (truthy) onto the
   * Cognito user pool's `signInAliases` and `autoVerify` settings. The
   * authoritative signals for "can sign in with" are `UsernameAttributes` and
   * `AliasAttributes`, so those are consulted first. `AutoVerifiedAttributes`
   * only controls whether Cognito sends a verification code on signup/update and
   * does not by itself make an attribute usable for sign in (e.g. a pool may
   * auto-verify an attribute for SMS-based recovery while supporting only plain
   * username sign-in). It is therefore used only as a fallback when neither
   * `UsernameAttributes` nor `AliasAttributes` is populated — which is the
   * shape of the pool in aws-amplify/amplify-cli#14810, where phone-based
   * verification is the only signal available.
   *
   * `defineAuth` requires at least one of email/phone, so we fall back to email
   * when the pool exposes none of the above (e.g. username-only sign-in),
   * matching the previous default behavior.
   */
  private static deriveLoginMechanisms(userPool: UserPoolType): { readonly email: boolean; readonly phone: boolean } {
    const signInAttributes = [...(userPool.UsernameAttributes ?? []), ...(userPool.AliasAttributes ?? [])];
    // Fall back to auto-verified attributes only when no sign-in attribute is
    // configured, since auto-verify alone does not imply the attribute is a
    // usable login mechanism.
    const signals = new Set<string>(signInAttributes.length > 0 ? signInAttributes : userPool.AutoVerifiedAttributes ?? []);
    let email = signals.has('email');
    const phone = signals.has('phone_number');
    if (!email && !phone) {
      email = true;
    }
    return { email, phone };
  }

  private createLogInWithPropertyAssignment(options: AuthRenderOptions, loginFlags: Record<string, boolean>): PropertyAssignment {
    const logInWith = factory.createIdentifier('loginWith');
    const assignments: ts.ObjectLiteralElementLike[] = [];

    const { email: emailEnabled, phone: phoneEnabled } = AuthRenderer.deriveLoginMechanisms(options.userPool);

    const emailOptions =
      options.userPool.EmailVerificationMessage || options.userPool.EmailVerificationSubject
        ? {
            emailVerificationBody: options.userPool.EmailVerificationMessage ?? '',
            emailVerificationSubject: options.userPool.EmailVerificationSubject ?? '',
          }
        : undefined;

    if (emailEnabled) {
      if (emailOptions) {
        assignments.push(
          factory.createPropertyAssignment(factory.createIdentifier('email'), this.createEmailDefinitionObject(emailOptions)),
        );
      } else {
        assignments.push(factory.createPropertyAssignment(factory.createIdentifier('email'), factory.createTrue()));
      }
    }

    if (phoneEnabled) {
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
            options.webClient.CallbackURLs,
            options.webClient.LogoutURLs,
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
      readonly attributeMappings: Readonly<Record<string, { standard: Record<string, string>; custom: Record<string, string> }>>;
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
      ts.addSyntheticLeadingComment(
        factory.createPropertyAssignment(
          factory.createIdentifier('callbackUrls'),
          factory.createArrayLiteralExpression(callbackUrls?.map((url) => factory.createStringLiteral(url))),
        ),
        ts.SyntaxKind.SingleLineCommentTrivia,
        ' Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.',
        true,
      ),
      ts.addSyntheticLeadingComment(
        factory.createPropertyAssignment(
          factory.createIdentifier('logoutUrls'),
          factory.createArrayLiteralExpression(logoutUrls?.map((url) => factory.createStringLiteral(url))),
        ),
        ts.SyntaxKind.SingleLineCommentTrivia,
        ' Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.',
        true,
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
    const userAttributeProperties: PropertyAssignment[] = [];

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
    attributeMapping: { standard: Record<string, string>; custom: Record<string, string> } | undefined,
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

      Object.entries(attributeMapping.standard).forEach(([key, value]) =>
        mappingProperties.push(factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value))),
      );

      if (Object.keys(attributeMapping.custom).length > 0) {
        const customProperties: ts.ObjectLiteralElementLike[] = [];
        Object.entries(attributeMapping.custom).forEach(([key, value]) =>
          customProperties.push(factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value))),
        );
        mappingProperties.push(
          factory.createPropertyAssignment(
            factory.createIdentifier('custom'),
            factory.createObjectLiteralExpression(customProperties, true),
          ),
        );
      }

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
    attributeMapping: { standard: Record<string, string>; custom: Record<string, string> } | undefined,
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

  // ── Escape hatch rendering ───────────────────────────────────────

  /** Builds the statements for the applyEscapeHatches function body. */
  private buildEscapeHatchStatements(options: AuthRenderOptions): ts.Statement[] {
    const statements: ts.Statement[] = [];

    const hasIdentityProviders = AuthRenderer.hasIdentityProviders(options.nativeClient);

    const userPoolOverrides = AuthRenderer.deriveUserPoolOverrides(options.userPool);
    if (Object.keys(userPoolOverrides).length > 0) {
      statements.push(...this.buildUserPoolOverrideStatements(userPoolOverrides));
    }

    // Declare cfnIdentityPool once when any IdentityPool escape hatch is needed
    // (either disabling unauth identities or removing the hard-coded
    // SupportedLoginProviders on regenerate). Defining the const twice would
    // produce invalid TypeScript. Skipped entirely when no Identity Pool exists
    // (User Pool-only configurations).
    const needsCfnIdentityPool =
      !!options.identityPool && (options.identityPool.AllowUnauthenticatedIdentities === false || hasIdentityProviders);
    if (needsCfnIdentityPool) {
      statements.push(TS.constFromBackend('cfnIdentityPool', 'auth', 'resources', 'cfnResources', 'cfnIdentityPool'));
    }

    if (options.identityPool?.AllowUnauthenticatedIdentities === false) {
      statements.push(TS.assignProp('cfnIdentityPool', 'allowUnauthenticatedIdentities', false));
    }

    if (hasIdentityProviders && options.identityPool) {
      // cfnIdentityPool.addPropertyDeletionOverride('SupportedLoginProviders')
      //
      // Gen1 generates SupportedLoginProviders on the IdentityPool from the
      // social IDP config at deploy time (Lambda-backed custom resource).
      // Gen2 handles social auth via the UserPool's IDP resources, not
      // SupportedLoginProviders. After refactor, leaving the Gen1 property
      // in place would trigger drift; removing it via CDK property deletion
      // override is how Gen2 communicates "don't manage this property."
      statements.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createIdentifier('cfnIdentityPool'),
              factory.createIdentifier('addPropertyDeletionOverride'),
            ),
            undefined,
            [factory.createStringLiteral('SupportedLoginProviders')],
          ),
        ),
      );
    }

    if (options.webClient.AllowedOAuthFlows) {
      statements.push(TS.constFromBackend('cfnUserPoolClient', 'auth', 'resources', 'cfnResources', 'cfnUserPoolClient'));
      statements.push(TS.assignProp('cfnUserPoolClient', 'allowedOAuthFlows', options.webClient.AllowedOAuthFlows));
    }

    statements.push(...this.buildNativeUserPoolClientStatements(options.nativeClient, !!options.identityPool));

    statements.push(TS.retentionLoop(TS.propAccess('backend', 'auth', 'stack', 'node'), AUTH_RESOURCES_TO_RETAIN));

    return statements;
  }

  /**
   * Overrides the UserPoolDomain's domain property to the Gen1 domain prefix,
   * preventing CFN from replacing it on the next deploy after the refactor has
   * imported the Gen1 physical domain under the Gen2 logical ID.
   */
  private buildDomainOverrideStatements(gen1Domain?: string): ts.Statement[] {
    if (!gen1Domain) return [];

    // const cfnUserPoolDomain = backend.auth.resources.userPool.node
    //   .findChild("UserPoolDomain").node.defaultChild as CfnUserPoolDomain;
    const domainExpr = factory.createAsExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
                    factory.createIdentifier('resources'),
                  ),
                  factory.createIdentifier('userPool'),
                ),
                factory.createIdentifier('node'),
              ),
              factory.createIdentifier('findChild'),
            ),
            undefined,
            [factory.createStringLiteral('UserPoolDomain')],
          ),
          factory.createIdentifier('node'),
        ),
        factory.createIdentifier('defaultChild'),
      ),
      factory.createTypeReferenceNode('CfnUserPoolDomain'),
    );

    return [TS.declareConst('cfnUserPoolDomain', domainExpr), TS.assignProp('cfnUserPoolDomain', 'domain', gen1Domain)];
  }

  /** Builds additional imports needed for the applyEscapeHatches function. */
  private buildAdditionalImports(options: AuthRenderOptions): Record<string, Set<string>> {
    const imports: Record<string, Set<string>> = {};

    if (!imports['aws-cdk-lib']) imports['aws-cdk-lib'] = new Set();
    imports['aws-cdk-lib'].add('CfnResource');
    imports['aws-cdk-lib'].add('Duration');

    if (AuthRenderer.hasIdentityProviders(options.nativeClient)) {
      if (!imports['aws-cdk-lib/aws-cognito']) imports['aws-cdk-lib/aws-cognito'] = new Set();
      imports['aws-cdk-lib/aws-cognito'].add('OAuthScope');
      imports['aws-cdk-lib/aws-cognito'].add('UserPoolClientIdentityProvider');
    }

    // CfnUserPoolDomain is the only symbol postRefactor() needs. Import whenever
    // a domain is present, independent of social providers — a hosted UI domain
    // can exist without IDPs.
    if (options.userPool.Domain) {
      if (!imports['aws-cdk-lib/aws-cognito']) imports['aws-cdk-lib/aws-cognito'] = new Set();
      imports['aws-cdk-lib/aws-cognito'].add('CfnUserPoolDomain');
    }

    if (options.nativeClient.ReadAttributes?.length || options.nativeClient.WriteAttributes?.length) {
      if (!imports['aws-cdk-lib/aws-cognito']) imports['aws-cdk-lib/aws-cognito'] = new Set();
      imports['aws-cdk-lib/aws-cognito'].add('ClientAttributes');
    }

    return imports;
  }

  /** Builds cfnUserPool password policy and username attribute override statements. */
  private buildUserPoolOverrideStatements(overrides: Record<string, string | boolean | number | string[] | undefined>): ts.Statement[] {
    const statements: ts.Statement[] = [];
    const mappedPolicyType: Record<string, string> = {
      MinimumLength: 'minimumLength',
      RequireUppercase: 'requireUppercase',
      RequireLowercase: 'requireLowercase',
      RequireNumbers: 'requireNumbers',
      RequireSymbols: 'requireSymbols',
      PasswordHistorySize: 'passwordHistorySize',
      TemporaryPasswordValidityDays: 'temporaryPasswordValidityDays',
    };

    statements.push(TS.constFromBackend('cfnUserPool', 'auth', 'resources', 'cfnResources', 'cfnUserPool'));

    const policies: { passwordPolicy: Record<string, number | string | boolean | string[]> } = {
      passwordPolicy: {},
    };

    for (const [overridePath, value] of Object.entries(overrides)) {
      if (overridePath.includes('PasswordPolicy')) {
        const policyKey = overridePath.split('.')[2];
        if (value !== undefined && policyKey in mappedPolicyType) {
          policies.passwordPolicy[mappedPolicyType[policyKey]] = value;
        }
      } else {
        statements.push(TS.assignProp('cfnUserPool', overridePath, value));
      }
    }

    statements.push(TS.assignProp('cfnUserPool', 'policies', policies));
    return statements;
  }

  private buildNativeUserPoolClientStatements(userPoolClient: UserPoolClientType, hasIdentityPool: boolean): ts.Statement[] {
    const statements: ts.Statement[] = [];
    const hasIdentityProviders = AuthRenderer.hasIdentityProviders(userPoolClient);

    statements.push(TS.constFromBackend('userPool', 'auth', 'resources', 'userPool'));

    const clientProps: ts.PropertyAssignment[] = [];

    if (userPoolClient.RefreshTokenValidity !== undefined) {
      clientProps.push(
        factory.createPropertyAssignment(
          'refreshTokenValidity',
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('Duration'), factory.createIdentifier('days')),
            undefined,
            [factory.createNumericLiteral(userPoolClient.RefreshTokenValidity)],
          ),
        ),
      );
    }

    if (userPoolClient.EnableTokenRevocation !== undefined) {
      clientProps.push(
        factory.createPropertyAssignment(
          'enableTokenRevocation',
          userPoolClient.EnableTokenRevocation ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }

    if (userPoolClient.EnablePropagateAdditionalUserContextData !== undefined) {
      clientProps.push(
        factory.createPropertyAssignment(
          'enablePropagateAdditionalUserContextData',
          userPoolClient.EnablePropagateAdditionalUserContextData ? factory.createTrue() : factory.createFalse(),
        ),
      );
    }

    if (userPoolClient.AuthSessionValidity !== undefined) {
      clientProps.push(
        factory.createPropertyAssignment(
          'authSessionValidity',
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('Duration'), factory.createIdentifier('minutes')),
            undefined,
            [factory.createNumericLiteral(userPoolClient.AuthSessionValidity)],
          ),
        ),
      );
    }

    if (hasIdentityProviders) {
      const providerMap: Record<string, string> = {
        COGNITO: 'COGNITO',
        Facebook: 'FACEBOOK',
        Google: 'GOOGLE',
        LoginWithAmazon: 'AMAZON',
        SignInWithApple: 'APPLE',
      };
      const providerElements = userPoolClient.SupportedIdentityProviders!.map((provider) => {
        const mapped = providerMap[provider] ?? provider.toUpperCase();
        return factory.createPropertyAccessExpression(
          factory.createIdentifier('UserPoolClientIdentityProvider'),
          factory.createIdentifier(mapped),
        );
      });
      clientProps.push(
        factory.createPropertyAssignment('supportedIdentityProviders', factory.createArrayLiteralExpression(providerElements)),
      );
    }

    if (
      userPoolClient.AllowedOAuthFlows?.length ||
      userPoolClient.AllowedOAuthScopes?.length ||
      userPoolClient.CallbackURLs?.length ||
      userPoolClient.LogoutURLs?.length
    ) {
      const oAuthProps: ts.PropertyAssignment[] = [];

      if (userPoolClient.CallbackURLs?.length) {
        oAuthProps.push(
          ts.addSyntheticLeadingComment(
            factory.createPropertyAssignment(
              'callbackUrls',
              factory.createArrayLiteralExpression(userPoolClient.CallbackURLs.map((url) => factory.createStringLiteral(url))),
            ),
            ts.SyntaxKind.SingleLineCommentTrivia,
            ' Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.',
            true,
          ),
        );
      }

      if (userPoolClient.LogoutURLs?.length) {
        oAuthProps.push(
          ts.addSyntheticLeadingComment(
            factory.createPropertyAssignment(
              'logoutUrls',
              factory.createArrayLiteralExpression(userPoolClient.LogoutURLs.map((url) => factory.createStringLiteral(url))),
            ),
            ts.SyntaxKind.SingleLineCommentTrivia,
            ' Add the Gen2 Amplify Hosting URL (e.g. https://<branch>.<gen2-appId>.amplifyapp.com/) to the following array after the gen2-main branch is deployed.',
            true,
          ),
        );
      }

      if (userPoolClient.AllowedOAuthFlows?.length) {
        oAuthProps.push(
          factory.createPropertyAssignment(
            'flows',
            factory.createObjectLiteralExpression([
              factory.createPropertyAssignment(
                'authorizationCodeGrant',
                userPoolClient.AllowedOAuthFlows.includes('code') ? factory.createTrue() : factory.createFalse(),
              ),
              factory.createPropertyAssignment(
                'implicitCodeGrant',
                userPoolClient.AllowedOAuthFlows.includes('implicit') ? factory.createTrue() : factory.createFalse(),
              ),
              factory.createPropertyAssignment(
                'clientCredentials',
                userPoolClient.AllowedOAuthFlows.includes('client_credentials') ? factory.createTrue() : factory.createFalse(),
              ),
            ]),
          ),
        );
      }

      if (userPoolClient.AllowedOAuthScopes?.length) {
        const scopeMap: Record<string, string> = {
          phone: 'PHONE',
          email: 'EMAIL',
          openid: 'OPENID',
          profile: 'PROFILE',
          'aws.cognito.signin.user.admin': 'COGNITO_ADMIN',
        };
        const scopeElements = userPoolClient.AllowedOAuthScopes.filter((s) => scopeMap[s]).map((scope) =>
          factory.createPropertyAccessExpression(factory.createIdentifier('OAuthScope'), factory.createIdentifier(scopeMap[scope])),
        );
        oAuthProps.push(factory.createPropertyAssignment('scopes', factory.createArrayLiteralExpression(scopeElements, true)));
      }

      clientProps.push(factory.createPropertyAssignment('oAuth', factory.createObjectLiteralExpression(oAuthProps, true)));
    }

    const hasOAuth = (userPoolClient.AllowedOAuthFlows?.length ?? 0) > 0;
    clientProps.push(factory.createPropertyAssignment('disableOAuth', hasOAuth ? factory.createFalse() : factory.createTrue()));
    clientProps.push(
      factory.createPropertyAssignment('generateSecret', userPoolClient.ClientSecret ? factory.createTrue() : factory.createFalse()),
    );

    if (userPoolClient.ReadAttributes?.length) {
      clientProps.push(
        factory.createPropertyAssignment('readAttributes', AuthRenderer.buildClientAttributesExpression(userPoolClient.ReadAttributes)),
      );
    }

    if (userPoolClient.WriteAttributes?.length) {
      clientProps.push(
        factory.createPropertyAssignment('writeAttributes', AuthRenderer.buildClientAttributesExpression(userPoolClient.WriteAttributes)),
      );
    }

    const addClientCall = factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('userPool'), factory.createIdentifier('addClient')),
      undefined,
      [factory.createStringLiteral('NativeAppClient'), factory.createObjectLiteralExpression(clientProps, true)],
    );

    const clientVarName = 'nativeUserPoolClient';
    statements.push(
      factory.createVariableStatement(
        undefined,
        factory.createVariableDeclarationList(
          [factory.createVariableDeclaration(factory.createIdentifier(clientVarName), undefined, undefined, addClientCall)],
          ts.NodeFlags.Const,
        ),
      ),
    );

    statements.push(...this.buildCognitoProvidersPushStatements(clientVarName, hasIdentityPool));

    if (hasIdentityProviders) {
      statements.push(...this.buildProviderSetupStatements());
    }

    return statements;
  }

  private static hasIdentityProviders(userPoolClient: UserPoolClientType): boolean {
    return (userPoolClient.SupportedIdentityProviders?.length ?? 0) > 0;
  }

  /**
   * Builds the cognitoIdentityProviders push block that registers the native app client
   * with the identity pool. Skipped when no identity pool is present (User Pool-only config).
   */
  private buildCognitoProvidersPushStatements(clientVarName: string, hasIdentityPool: boolean): ts.Statement[] {
    if (!hasIdentityPool) return [];

    const statements: ts.Statement[] = [];

    // const cognitoProviders = backend.auth.resources.cfnResources.cfnIdentityPool.cognitoIdentityProviders;
    statements.push(
      TS.declareConst(
        'cognitoProviders',
        TS.propAccess('backend', 'auth', 'resources', 'cfnResources', 'cfnIdentityPool', 'cognitoIdentityProviders'),
      ),
    );

    // if (cognitoProviders && Array.isArray(cognitoProviders)) { cognitoProviders.push({...}) }
    const pushArg = factory.createObjectLiteralExpression(
      [
        factory.createPropertyAssignment(
          'clientId',
          factory.createPropertyAccessExpression(factory.createIdentifier(clientVarName), factory.createIdentifier('userPoolClientId')),
        ),
        factory.createPropertyAssignment(
          'providerName',
          factory.createTemplateExpression(factory.createTemplateHead('cognito-idp.'), [
            factory.createTemplateSpan(
              TS.propAccess('backend', 'auth', 'stack', 'region') as ts.Expression,
              factory.createTemplateMiddle('.amazonaws.com/'),
            ),
            factory.createTemplateSpan(
              factory.createPropertyAccessExpression(factory.createIdentifier('userPool'), factory.createIdentifier('userPoolId')),
              factory.createTemplateTail(''),
            ),
          ]),
        ),
      ],
      false,
    );

    const pushCall = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('cognitoProviders'), factory.createIdentifier('push')),
        undefined,
        [pushArg],
      ),
    );

    const ifStatement = factory.createIfStatement(
      factory.createBinaryExpression(
        factory.createIdentifier('cognitoProviders'),
        factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('Array'), factory.createIdentifier('isArray')),
          undefined,
          [factory.createIdentifier('cognitoProviders')],
        ),
      ),
      factory.createBlock([pushCall], true),
    );

    statements.push(ifStatement);

    return statements;
  }

  /**
   * Builds a `new ClientAttributes().withStandardAttributes({...}).withCustomAttributes(...)` expression
   * from a list of Cognito attribute names (e.g. `['email', 'birthdate', 'custom:foo']`).
   */
  private static buildClientAttributesExpression(attributes: readonly string[]): ts.Expression {
    const standardProps: ts.PropertyAssignment[] = [];
    const customNames: string[] = [];

    for (const attr of attributes) {
      if (attr.startsWith('custom:')) {
        customNames.push(attr);
      } else if (attr in MAPPED_USER_ATTRIBUTE_NAME) {
        standardProps.push(
          factory.createPropertyAssignment(factory.createIdentifier(MAPPED_USER_ATTRIBUTE_NAME[attr]), factory.createTrue()),
        );
      }
    }

    let expr: ts.Expression = factory.createNewExpression(factory.createIdentifier('ClientAttributes'), undefined, []);

    if (standardProps.length > 0) {
      expr = factory.createCallExpression(
        factory.createPropertyAccessExpression(expr, factory.createIdentifier('withStandardAttributes')),
        undefined,
        [factory.createObjectLiteralExpression(standardProps, true)],
      );
    }

    if (customNames.length > 0) {
      expr = factory.createCallExpression(
        factory.createPropertyAccessExpression(expr, factory.createIdentifier('withCustomAttributes')),
        undefined,
        customNames.map((name) => factory.createStringLiteral(name)),
      );
    }

    return expr;
  }

  /** Builds the providerSetupResult code. */
  private buildProviderSetupStatements(): ts.Statement[] {
    const statements: ts.Statement[] = [];

    const findCall = factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
              factory.createIdentifier('stack'),
            ),
            factory.createIdentifier('node'),
          ),
          factory.createIdentifier('children'),
        ),
        factory.createIdentifier('find'),
      ),
      undefined,
      [
        factory.createArrowFunction(
          undefined,
          undefined,
          [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('child'))],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('child'), factory.createIdentifier('node')),
              factory.createIdentifier('id'),
            ),
            factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
            factory.createStringLiteral('amplifyAuth'),
          ),
        ),
      ],
    );

    const providerSetupDeclaration = factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'providerSetupResult',
            undefined,
            undefined,
            factory.createPropertyAccessExpression(
              factory.createParenthesizedExpression(
                factory.createAsExpression(findCall, factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)),
              ),
              factory.createIdentifier('providerSetupResult'),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    statements.push(providerSetupDeclaration);

    const forEachStatement = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('Object'), factory.createIdentifier('keys')),
            undefined,
            [factory.createIdentifier('providerSetupResult')],
          ),
          factory.createIdentifier('forEach'),
        ),
        undefined,
        [
          factory.createArrowFunction(
            undefined,
            undefined,
            [factory.createParameterDeclaration(undefined, undefined, factory.createIdentifier('provider'))],
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            factory.createBlock(
              [
                factory.createVariableStatement(
                  undefined,
                  factory.createVariableDeclarationList(
                    [
                      factory.createVariableDeclaration(
                        'providerSetupPropertyValue',
                        undefined,
                        undefined,
                        factory.createElementAccessExpression(
                          factory.createIdentifier('providerSetupResult'),
                          factory.createIdentifier('provider'),
                        ),
                      ),
                    ],
                    ts.NodeFlags.Const,
                  ),
                ),
                factory.createIfStatement(
                  factory.createLogicalAnd(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('providerSetupPropertyValue'),
                      factory.createIdentifier('node'),
                    ),
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createPropertyAccessExpression(
                              factory.createPropertyAccessExpression(
                                factory.createIdentifier('providerSetupPropertyValue'),
                                factory.createIdentifier('node'),
                              ),
                              factory.createIdentifier('id'),
                            ),
                            factory.createIdentifier('toLowerCase'),
                          ),
                          undefined,
                          [],
                        ),
                        factory.createIdentifier('endsWith'),
                      ),
                      undefined,
                      [factory.createStringLiteral('idp')],
                    ),
                  ),
                  factory.createBlock(
                    [
                      factory.createExpressionStatement(
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier('nativeUserPoolClient'),
                              factory.createIdentifier('node'),
                            ),
                            factory.createIdentifier('addDependency'),
                          ),
                          undefined,
                          [factory.createIdentifier('providerSetupPropertyValue')],
                        ),
                      ),
                    ],
                    true,
                  ),
                ),
              ],
              true,
            ),
          ),
        ],
      ),
    );
    statements.push(forEachStatement);

    return statements;
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
