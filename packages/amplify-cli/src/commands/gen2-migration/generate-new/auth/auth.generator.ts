import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import {
  GroupType,
  IdentityProviderType,
  IdentityProviderTypeType,
  LambdaConfigType,
  PasswordPolicyType,
  ProviderDescription,
  SchemaAttributeType,
  SoftwareTokenMfaConfigType,
  UserPoolClientType,
  UserPoolMfaType,
  UserPoolType,
} from '@aws-sdk/client-cognito-identity-provider';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { printNodes } from '../ts-writer';
import {
  Attribute,
  AttributeMappingRule,
  AuthDefinition,
  AuthRenderer,
  AuthTriggerEvents,
  CustomAttribute,
  CustomAttributes,
  EmailOptions,
  FunctionDefinition,
  Lambda,
  LoginOptions,
  MultifactorOptions,
  OidcOptions,
  PasswordPolicyPath,
  PolicyOverrides,
  ReferenceAuth,
  SamlOptions,
  Scope,
  StandardAttribute,
  StandardAttributes,
} from './auth.renderer';

const factory = ts.factory;

/**
 * Generates auth resource files and contributes to backend.ts.
 *
 * Reads the Gen1 Cognito configuration (user pool, identity pool,
 * identity providers, MFA, groups, triggers) and generates
 * amplify/auth/resource.ts with a defineAuth() call. Also contributes
 * auth imports and CDK overrides (password policy, user pool client
 * settings, identity pool config) to backend.ts.
 */
export class AuthGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly functions: FunctionDefinition[] | undefined;
  private readonly defineAuth: AuthRenderer;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, functions?: FunctionDefinition[]) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.functions = functions;
    this.defineAuth = new AuthRenderer();
  }

  /**
   * Plans the auth generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const authCategory = await this.gen1App.fetchMetaCategory('auth');
    if (!authCategory) {
      return [];
    }

    // Check for reference auth (imported resources)
    const referenceAuth = await this.buildReferenceAuth(authCategory);
    if (referenceAuth) {
      return this.planReferenceAuth(referenceAuth);
    }

    // Standard auth: fetch all Cognito resources
    const resources = await this.gen1App.fetchResourcesByLogicalId();
    const userPool = await this.gen1App.aws.fetchUserPool(resources);
    if (!userPool) {
      return [];
    }

    const [mfaConfig, webClient, userPoolClient, identityProviders, identityGroups, identityPool, authTriggerConnections] =
      await Promise.all([
        this.gen1App.aws.fetchMfaConfig(resources),
        this.gen1App.aws.fetchWebClient(resources),
        this.gen1App.aws.fetchUserPoolClient(resources),
        this.gen1App.aws.fetchIdentityProviders(resources),
        this.gen1App.aws.fetchIdentityGroups(resources),
        this.gen1App.aws.fetchIdentityPool(resources),
        this.gen1App.fetchAuthTriggerConnections(),
      ]);

    // Build the AuthDefinition using the existing adapter
    const authDefinition = getAuthDefinition({
      userPool,
      identityPoolName: identityPool?.identityPoolName,
      identityProviders: identityProviders.map((p) => ({
        ProviderName: p.ProviderName,
        ProviderType: p.ProviderType,
        CreationDate: p.CreationDate,
        LastModifiedDate: p.LastModifiedDate,
      })),
      identityProvidersDetails: identityProviders,
      identityGroups,
      webClient,
      authTriggerConnections,
      guestLogin: identityPool?.guestLogin,
      mfaConfig: mfaConfig?.mfaConfig,
      totpConfig: mfaConfig?.totpConfig,
      userPoolClient,
    });

    return this.planStandardAuth(authDefinition);
  }

  private planReferenceAuth(authDefinition: AuthDefinition): AmplifyMigrationOperation[] {
    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    return [
      {
        describe: async () => ['Generate auth/resource.ts (reference auth)'],
        execute: async () => {
          const nodes = this.defineAuth.render({
            definition: authDefinition,
            functions: this.functions,
            functionCategories: new Map(),
          });
          const content = printNodes(nodes);

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.contributeToBackend(authDefinition);
        },
      },
    ];
  }

  private planStandardAuth(authDefinition: AuthDefinition): AmplifyMigrationOperation[] {
    const authDir = path.join(this.outputDir, 'amplify', 'auth');

    // Build function category map for correct import paths in resource.ts
    const functionCategories = new Map<string, string>();
    if (this.functions) {
      for (const func of this.functions) {
        if (func.resourceName && func.category) {
          functionCategories.set(func.resourceName, func.category);
        }
      }
    }

    return [
      {
        describe: async () => ['Generate auth/resource.ts'],
        execute: async () => {
          const nodes = this.defineAuth.render({
            definition: authDefinition,
            functions: this.functions,
            functionCategories,
          });
          let content = printNodes(nodes);

          // Post-process: fix generated code patterns
          content = content.replace(/\(allow, _unused\)/g, '(allow: any)');
          content = content.replace(/(access: \(allow: any\) => \[[\s\S]*?\n {4}\])/g, '$1,');

          await fs.mkdir(authDir, { recursive: true });
          await fs.writeFile(path.join(authDir, 'resource.ts'), content, 'utf-8');

          this.contributeToBackend(authDefinition);
        },
      },
    ];
  }

  /**
   * Adds auth imports and CDK overrides to backend.ts.
   */
  private contributeToBackend(_auth: AuthDefinition): void {
    const authIdentifier = factory.createIdentifier('auth');
    this.backendGenerator.addImport('./auth/resource', ['auth']);
    this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(authIdentifier));

    // CDK overrides for password policy, identity pool, user pool client
    // are handled by the BackendGenerator when it assembles backend.ts.
    // The auth definition properties (userPoolOverrides, guestLogin,
    // oAuthFlows, readAttributes, writeAttributes, userPoolClient) are
    // consumed by the synthesizer logic that will be migrated in Phase 3.
  }

  /**
   * Checks if the auth category uses imported (reference) resources.
   */
  private async buildReferenceAuth(authCategory: Record<string, unknown>): Promise<AuthDefinition | undefined> {
    const isImported = Object.values(authCategory).some(
      (value) => typeof value === 'object' && value !== null && 'serviceType' in value && (value as any).serviceType === 'imported',
    );
    if (!isImported) return undefined;

    const firstAuth = Object.values(authCategory)[0] as any;
    const userPoolId = firstAuth?.output?.UserPoolId as string | undefined;
    const userPoolClientId = firstAuth?.output?.AppClientIDWeb as string | undefined;
    const identityPoolId = firstAuth?.output?.IdentityPoolId as string | undefined;

    if (!userPoolId && !userPoolClientId && !identityPoolId) {
      throw new Error('No user pool or identity pool found for import.');
    }

    const roles = identityPoolId ? await this.gen1App.aws.fetchIdentityPoolRoles(identityPoolId) : undefined;
    const groups = userPoolId ? await this.gen1App.aws.fetchGroupsByUserPoolId(userPoolId) : undefined;

    return {
      referenceAuth: {
        userPoolId,
        userPoolClientId,
        identityPoolId,
        unauthRoleArn: roles?.unauthenticated,
        authRoleArn: roles?.authenticated,
        groups,
      },
    };
  }
}

// ── Auth adapter functions ─────────────────────────────────────────
// Converts Cognito SDK types to AuthDefinition. Inlined from the
// former auth-adapter.ts to eliminate the unjustified layer boundary
// (guideline 2).

type AuthTriggerConnectionSourceMap = Partial<Record<keyof LambdaConfigType, string>>;

interface AuthSynthesizerOptions {
  readonly userPool: UserPoolType;
  readonly identityPoolName?: string;
  readonly identityProviders?: ProviderDescription[];
  readonly identityProvidersDetails?: IdentityProviderType[];
  readonly identityGroups?: GroupType[];
  readonly webClient?: UserPoolClientType;
  readonly authTriggerConnections?: AuthTriggerConnectionSourceMap;
  readonly referenceAuth?: ReferenceAuth;
  readonly guestLogin?: boolean;
  readonly mfaConfig?: UserPoolMfaType;
  readonly totpConfig?: SoftwareTokenMfaConfigType;
  readonly userPoolClient?: UserPoolClientType;
}

const COGNITO_TRIGGERS_TO_SKIP = ['PreTokenGenerationConfig'];

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

function getPasswordPolicyOverrides(passwordPolicy: Partial<PasswordPolicyType>): Partial<PolicyOverrides> {
  const policyOverrides: Partial<PolicyOverrides> = {};
  const passwordOverridePath = (policyKey: keyof PasswordPolicyType): PasswordPolicyPath => `Policies.PasswordPolicy.${policyKey}`;
  for (const key of Object.keys(passwordPolicy)) {
    const typedKey = key as keyof PasswordPolicyType;
    if (passwordPolicy[typedKey] !== undefined) {
      policyOverrides[passwordOverridePath(typedKey)] = passwordPolicy[typedKey];
    }
  }
  return policyOverrides;
}

function getUserPoolOverrides(userPool: UserPoolType): Partial<PolicyOverrides> {
  const userPoolOverrides: Partial<PolicyOverrides> = {};
  Object.assign(userPoolOverrides, getPasswordPolicyOverrides(userPool.Policies?.PasswordPolicy ?? {}));
  if (userPool.UsernameAttributes === undefined || userPool.UsernameAttributes.length === 0) {
    userPoolOverrides.usernameAttributes = undefined;
  } else {
    userPoolOverrides.usernameAttributes = userPool.UsernameAttributes;
  }
  return userPoolOverrides;
}

function getMfaConfiguration(mfaConfig?: UserPoolMfaType, totpConfig?: SoftwareTokenMfaConfigType): MultifactorOptions {
  const multifactor: MultifactorOptions = { mode: 'OFF' };
  if (mfaConfig === 'ON') {
    multifactor.mode = 'REQUIRED';
    multifactor.sms = true;
    multifactor.totp = totpConfig?.Enabled ?? false;
  } else if (mfaConfig === 'OPTIONAL') {
    multifactor.mode = 'OPTIONAL';
    multifactor.sms = true;
    multifactor.totp = totpConfig?.Enabled ?? false;
  }
  return multifactor;
}

function getEmailConfig(userPool: UserPoolType): EmailOptions {
  return {
    emailVerificationBody: userPool.EmailVerificationMessage ?? '',
    emailVerificationSubject: userPool.EmailVerificationSubject ?? '',
  };
}

function getStandardUserAttributes(signupAttributes: SchemaAttributeType[] | undefined): StandardAttributes {
  return (
    signupAttributes?.reduce((standardAttributes: StandardAttributes, attribute: SchemaAttributeType) => {
      const standardAttribute: StandardAttribute = {
        required: attribute.Required,
        mutable: attribute.Mutable,
      };
      if (attribute.Name !== undefined && attribute.Name in MAPPED_USER_ATTRIBUTE_NAME && attribute.Required) {
        return {
          ...standardAttributes,
          [MAPPED_USER_ATTRIBUTE_NAME[attribute.Name] as Attribute]: standardAttribute,
        };
      }
      return standardAttributes;
    }, {} as StandardAttributes) || {}
  );
}

function getCustomUserAttributes(signupAttributes: SchemaAttributeType[] | undefined): CustomAttributes {
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
}

function getGroups(identityGroups?: GroupType[]): string[] {
  if (!identityGroups || identityGroups.length === 0) {
    return [];
  }
  return identityGroups
    .filter((group) => group.Precedence !== undefined)
    .sort((a, b) => (a.Precedence || 0) - (b.Precedence || 0))
    .map((group) => group.GroupName)
    .filter((groupName): groupName is string => groupName !== undefined);
}

function getScopes(scopes: string[]): Scope[] {
  return scopes.filter((scope): scope is Scope => ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'].includes(scope));
}

function getProviderSpecificScopes(providerDetails: Record<string, string>): string[] {
  const scopeFields = ['authorized_scopes', 'scope', 'scopes'];
  for (const field of scopeFields) {
    if (providerDetails[field]) {
      return providerDetails[field].split(/[\s,]+/).filter((scope) => scope.length > 0);
    }
  }
  return [];
}

function mappedLambdaConfigKey(key: keyof LambdaConfigType): AuthTriggerEvents {
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
}

function getAuthTriggers(
  lambdaConfig: LambdaConfigType,
  triggerSourceFiles: AuthTriggerConnectionSourceMap,
): Partial<Record<AuthTriggerEvents, Lambda>> {
  return Object.keys(lambdaConfig)
    .filter((triggerName) => !COGNITO_TRIGGERS_TO_SKIP.includes(triggerName))
    .reduce((prev, key) => {
      const typedKey = key as keyof LambdaConfigType;
      prev[mappedLambdaConfigKey(typedKey)] = { source: triggerSourceFiles[typedKey] ?? '' };
      return prev;
    }, {} as Partial<Record<AuthTriggerEvents, Lambda>>);
}

function filterAttributeMapping(attributeMapping: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(attributeMapping)
      .filter(([key]) => Object.keys(MAPPED_USER_ATTRIBUTE_NAME).includes(key))
      .map(([key, value]) => [MAPPED_USER_ATTRIBUTE_NAME[key], value]),
  );
}

function getAuthDefinition({
  userPool,
  identityPoolName,
  identityProviders,
  identityProvidersDetails,
  identityGroups,
  webClient,
  authTriggerConnections,
  guestLogin,
  mfaConfig,
  totpConfig,
  userPoolClient,
}: AuthSynthesizerOptions): AuthDefinition {
  const loginWith: LoginOptions = { email: true };

  if (identityProviders !== undefined) {
    identityProviders.forEach((provider) => {
      const loginWithProperty = MAP_IDENTITY_PROVIDER[provider?.ProviderType as keyof typeof MAP_IDENTITY_PROVIDER];
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
        if (AttributeMapping) oidcOption.attributeMapping = filterAttributeMapping(AttributeMapping) as AttributeMappingRule;
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
        if (AttributeMapping) samlOptions.attributeMapping = filterAttributeMapping(AttributeMapping) as AttributeMappingRule;
      } else {
        if (AttributeMapping) {
          const attributeOption = MAP_IDENTITY_PROVIDER[provider?.ProviderType as keyof typeof MAP_IDENTITY_PROVIDER][1];
          loginWith[attributeOption] = filterAttributeMapping(AttributeMapping);
        }

        if (ProviderDetails) {
          const providerScopes = getProviderSpecificScopes(ProviderDetails);
          if (providerScopes.length > 0) {
            const scopePropertyMap: Record<string, string> = {
              [IdentityProviderTypeType.Google]: 'googleScopes',
              [IdentityProviderTypeType.Facebook]: 'facebookScopes',
              [IdentityProviderTypeType.LoginWithAmazon]: 'amazonScopes',
              [IdentityProviderTypeType.SignInWithApple]: 'appleScopes',
            };

            const scopeProperty = scopePropertyMap[ProviderType as keyof typeof scopePropertyMap];
            if (scopeProperty) {
              const mappedScopes = providerScopes
                .map((scope) => (scope === 'public_profile' ? 'profile' : scope))
                .filter((scope) => ['phone', 'email', 'openid', 'profile', 'aws.cognito.signin.user.admin'].includes(scope));

              loginWith[scopeProperty] = mappedScopes;
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
    loginWith.callbackURLs = webClient.CallbackURLs;
  }
  if (webClient?.LogoutURLs) {
    loginWith.logoutURLs = webClient.LogoutURLs;
  }
  if (webClient?.AllowedOAuthScopes) {
    loginWith.scopes = getScopes(webClient.AllowedOAuthScopes);
  }

  const userPoolOverrides = getUserPoolOverrides(userPool);
  return {
    loginOptions: loginWith,
    mfa: getMfaConfiguration(mfaConfig, totpConfig),
    standardUserAttributes: getStandardUserAttributes(userPool.SchemaAttributes),
    customUserAttributes: getCustomUserAttributes(userPool.SchemaAttributes),
    groups: getGroups(identityGroups),
    userPoolOverrides,
    lambdaTriggers: getAuthTriggers(userPool.LambdaConfig ?? {}, authTriggerConnections ?? {}),
    guestLogin,
    identityPoolName,
    oAuthFlows: webClient?.AllowedOAuthFlows,
    readAttributes: webClient?.ReadAttributes,
    writeAttributes: webClient?.WriteAttributes,
    userPoolClient,
  };
}
