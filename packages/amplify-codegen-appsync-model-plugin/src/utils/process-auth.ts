import { CodeGenDirectives, CodeGenDirective, CodeGenModel, CodeGenField } from '../visitors/appsync-visitor';
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
const DEFAULT_OPERATIONS = [AuthModelOperation.create, AuthModelOperation.update, AuthModelOperation.delete, AuthModelOperation.read];
const DEFAULT_AUTH_PROVIDER = AuthProvider.userPools;
const DEFAULT_OWNER_FIELD = 'owner';
const DEFAULT_GROUPS_FIELD = 'groups';

export type AuthRule = {
  allow: AuthStrategy;
  provider?: AuthProvider;
  operations: (AuthModelOperation | AuthModelMutation)[];
  groupField?: string;
  ownerField?: string;
  groups?: string[];
  identityField?: string; // deprecated
  identityClaim?: string;
  groupClaim?: string;
  mutations?: AuthModelMutation[]; // deprecated
};

export type AuthDirective = CodeGenDirective & {
  arguments: {
    rules: AuthRule[];
  };
};

export function processAuthDirective(directives: CodeGenDirectives): AuthDirective[] {
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
            groupField: rule.groups ? undefined : rule.groupField || DEFAULT_GROUPS_FIELD,
            operations,
          };
        }
        return { ...rule, operations };
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

export function getOwnerAuthRules(modelObj: CodeGenModel): AuthRule[] {
  let rules = Array<AuthRule>();
  for (let directive of modelObj.directives) {
    if ("auth" === directive.name) {
      for (let rule of directive.arguments.rules) {
        if (rule.allow === AuthStrategy.owner) {
          rules.push(rule);
        }
      }
    }
  }
  return rules;
}

export function getOwnerFieldName(rule: AuthRule): string | undefined {
  if (rule.ownerField === undefined) {
    return "owner";
  } else {
    return rule.ownerField
  }
}

export function hasOwnerField(fields: CodeGenField[], ownerField: string): boolean {
  let ownerFields = fields.filter(field => field.name === ownerField);
  return ownerFields && ownerFields.length !== 0
}
