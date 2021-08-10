import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-core';
export type AuthStrategy = 'owner' | 'groups' | 'public' | 'private';
export type AuthProvider = 'apiKey' | 'iam' | 'oidc' | 'userPools' | null;
export type ModelQuery = 'get' | 'list';
export type ModelMutation = 'create' | 'update' | 'delete';
export type ModelOperation = 'create' | 'update' | 'delete' | 'read';

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
}

export interface AuthTransformerConfig {
  authConfig: AppSyncAuthConfiguration;
  addAwsIamAuthInOutputSchema: boolean;
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
  }
  enum AuthProvider {
    apiKey
    iam
    oidc
    userPools
  }
  enum ModelOperation {
    create
    update
    delete
    read
  }
`;
