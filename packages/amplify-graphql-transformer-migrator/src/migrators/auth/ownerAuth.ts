import { getAuthRules } from '.';
import { createAuthRule } from '../generators';

function getPrivateAuthRule(rules: any, provider: any) {
  return rules.find((rule: any) => {
    const foundStrategy = rule.fields.find((f: any) => f.name.value === 'allow')?.value?.value;
    const foundProvider = rule.fields.find((f: any) => f.name.value === 'provider')?.value?.value;

    if (foundStrategy !== 'private') {
      return false;
    }

    if (provider === 'userPools' && (foundProvider === undefined || foundProvider === 'userPools')) {
      return true;
    } else if (provider === 'iam' && foundProvider === 'iam') {
      return true;
    }
    return false;
  });
}

function getOwnerAuthRules(rules: any) {
  return rules.filter((rule: any) => rule.fields.find((f: any) => f?.name?.value === 'allow')?.value?.value === 'owner');
}

function getGroupAuthRules(rules: any) {
  return rules.filter((rule: any) => rule.fields.find((f: any) => f?.name?.value === 'allow')?.value?.value === 'groups');
}

const ops = ['create', 'read', 'update', 'delete'];

export function migrateOwnerAuth(node: any, defaultAuthMode: any) {
  const authRules = getAuthRules(node);

  // check if owner-based auth exist and if operations allow everything.
  const deniedOperations: Set<string> = new Set();
  const userBasedRulesWithProtection = getOwnerAuthRules(authRules).concat(getGroupAuthRules(authRules));
  if (userBasedRulesWithProtection.length === 0) return;

  userBasedRulesWithProtection.forEach((rule: any) => {
    const operationsFieldIndex = rule.fields.findIndex((f: any) => f.name.value === 'operations');

    if (operationsFieldIndex === -1) {
      ops.forEach(op => deniedOperations.add(op));
    } else {
      // remember denied operations
      rule.fields[operationsFieldIndex].value.values.forEach((op: any) => deniedOperations.add(op.value));
      // maintain full CRUD access for owners
      if (userBasedRulesWithProtection.length === 1) rule.fields.splice(operationsFieldIndex, 1);
    }
  });

  const hasAllImplicitOperations = deniedOperations.size === 4;
  const privateRule = getPrivateAuthRule(authRules, defaultAuthMode);

  if (hasAllImplicitOperations || privateRule) return;

  const explicitOperations = ops.filter(x => !deniedOperations.has(x));

  authRules.push(createAuthRule('private', defaultAuthMode, explicitOperations));
}
