export type AuthStrategy = 'owner' | 'groups' | 'public' | 'private';
export type AuthProvider = 'apiKey' | 'iam' | 'oidc' | 'userPools';
export type ModelQuery = 'get' | 'list';
export type ModelMutation = 'create' | 'update' | 'delete';
export type ModelOperation = 'create' | 'update' | 'delete' | 'read';
export interface AuthRule {
  allow: AuthStrategy;
  provider?: AuthProvider;
  ownerField?: string;
  identityField?: string;
  identityClaim?: string;
  groupsField?: string;
  groupClaim?: string;
  groups?: string[];
  operations?: ModelOperation[];
  queries?: ModelQuery[];
  mutations?: ModelMutation[];
  // Used only for IAM provider to decide if an IAM policy needs to be generated. IAM auth with AdminUI does not need IAM policies
  generateIAMPolicy?: boolean;
}
