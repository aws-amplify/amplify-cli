import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
export type AuthStrategy = 'owner' | 'groups' | 'public' | 'private' | 'custom';
export type AuthProvider = 'apiKey' | 'iam' | 'oidc' | 'userPools' | 'function';
export type ModelQuery = 'get' | 'list';
export type ModelMutation = 'create' | 'update' | 'delete';
export type ModelOperation = 'create' | 'update' | 'delete' | 'read';

export type RelationalPrimaryMapConfig = Map<string, { claim: string; field: string }>;
export interface SearchableConfig {
  queries: {
    search: string;
  };
}

export interface AuthTransformerConfig {
  /** used mainly in the before step to pass the authConfig from the transformer core down to the directive */
  authConfig?: AppSyncAuthConfiguration;
  /** using the iam provider the resolvers checks will lets the roles in this list passthrough the acm */
  adminRoles?: Array<string>;
  /** when authorizing private/public @auth can also check authenticated/unauthenticated status for a given identityPoolId */
  identityPoolId?: string;
}

export interface RolesByProvider {
  cognitoStaticRoles: Array<RoleDefinition>;
  cognitoDynamicRoles: Array<RoleDefinition>;
  oidcStaticRoles: Array<RoleDefinition>;
  oidcDynamicRoles: Array<RoleDefinition>;
  iamRoles: Array<RoleDefinition>;
  apiKeyRoles: Array<RoleDefinition>;
  lambdaRoles: Array<RoleDefinition>;
}

export interface AuthRule {
  allow: AuthStrategy;
  provider?: AuthProvider;
  ownerField?: string;
  identityClaim?: string;
  groupsField?: string;
  groupClaim?: string;
  groups?: string[];
  operations?: ModelOperation[];
  // Used only for IAM provider to decide if an IAM policy needs to be generated. IAM auth with AdminUI does not need IAM policies
  generateIAMPolicy?: boolean;
}

export interface RoleDefinition {
  provider: AuthProvider;
  strategy: AuthStrategy;
  static: boolean;
  claim?: string;
  entity?: string;
  // specific to mutations
  allowedFields?: Array<string>;
  nullAllowedFields?: Array<string>;
}

export interface AuthDirective {
  rules: AuthRule[];
}

export interface ConfiguredAuthProviders {
  default: AuthProvider;
  onlyDefaultAuthProviderConfigured: boolean;
  hasApiKey: boolean;
  hasUserPools: boolean;
  hasOIDC: boolean;
  hasIAM: boolean;
  hasLambda: boolean;
  hasAdminRolesEnabled: boolean;
  adminRoles: Array<string>;
  identityPoolId?: string;
}

export const authDirectiveDefinition = `
  directive @auth(rules: [AuthRule!]!) on OBJECT | FIELD_DEFINITION
  input AuthRule {
    allow: AuthStrategy!
    provider: AuthProvider
    identityClaim: String
    groupClaim: String
    ownerField: String
    groupsField: String
    groups: [String]
    operations: [ModelOperation]
  }
  enum AuthStrategy {
    owner
    groups
    private
    public
    custom
  }
  enum AuthProvider {
    apiKey
    iam
    oidc
    userPools
    function
  }
  enum ModelOperation {
    create
    update
    delete
    read
  }
`;
