import { CodeGenDirectives } from '../visitors/appsync-visitor';
export enum AuthProvider {
  apiKey = 'apiKey',
  iam = 'iam',
  oidc = 'oidc',
  userPools = 'userPools',
}
export enum AuthStrategy {
  owner = 'owner',
  groups = 'groups',
  private = 'private',
  public = 'public',
}

export enum AuthModelOperation {
  create = 'create',
  update = 'update',
  delete = 'delete',
  read = 'read',
}

export enum AuthModelMutation {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

const DEFAULT_GROUP_CLAIM = 'cognito:groups';
const DEFAULT_IDENTITY_CLAIM = 'username';
const DEFAULT_OPERATIONS = [AuthModelOperation.create, AuthModelOperation.update, AuthModelOperation.delete];
const DEFAULT_AUTH_PROVIDER = AuthProvider.userPools;
const DEFAULT_OWNER_FIELD = 'owner';

export type AuthRule = {
  allow: AuthStrategy;
  provider?: AuthProvider;
  operations?: AuthModelOperation[] | AuthModelMutation[];
  groupField?: string;
  ownerField?: string;
  groups?: string[];
  identityField?: string; // deprecated
  identityClaim?: string;
  groupClaim?: string;
  mutations?: AuthModelMutation[]; // deprecated
};

export function processAuthDirective(directives: CodeGenDirectives): CodeGenDirectives {
  const authDirectives = directives.filter(d => d.name === 'auth');

  return authDirectives.map(d => {
    // filter dynamic groups as they are not supported in subscription
    const authRules: AuthRule[] = d.arguments.rules || [];
    const processedRules: AuthRule[] = authRules
      .filter((rule: AuthRule) => !(rule.allow === AuthStrategy.groups && rule.groupField))
      .map((rule: AuthRule) => {
        const operations = rule.operations || rule.mutations || DEFAULT_OPERATIONS;
        const identityClaim = rule.identityClaim || rule.identityField || DEFAULT_IDENTITY_CLAIM;

        if (rule.allow === AuthStrategy.owner) {
          return {
            // transformer looks for cognito:username when identityClaim is set to username
            provider: DEFAULT_AUTH_PROVIDER,
            ownerField: DEFAULT_OWNER_FIELD,
            ...rule,
            identityClaim: identityClaim === 'username' ? 'cognito:username' : identityClaim,
            operations,
          };
        } else if (rule.allow === AuthStrategy.groups) {
          return {
            groupClaim: DEFAULT_GROUP_CLAIM,
            provider: DEFAULT_AUTH_PROVIDER,
            ...rule,
            operations,
          };
        }
        return rule;
      });

    return {
      ...d,
      arguments: {
        ...d.arguments,
        rules: processedRules,
      },
    };
  });
}
