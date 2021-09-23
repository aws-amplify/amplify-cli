import { isModelType } from '../model';
import { migrateDefaultAuthMode } from './defaultAuth';
import { migrateFieldAuth } from './fieldAuth';
import { migrateOwnerAuth } from './ownerAuth';
import { createArgumentNode, createAuthRule, createDirectiveNode, createListValueNode } from '../generators';

export function hasAuthDirectives(node: any) {
  return node.directives.some((dir: any) => dir.name.value === 'auth');
}

export function getAuthRules(node: any) {
  return node.directives.find((dir: any) => dir.name.value === 'auth').arguments[0].value.values;
}

export function setAuthRules(node: any, rules: any) {
  node.directives.find((dir: any) => dir.name.value === 'auth').arguments[0].value.values = rules;
}

export function addAuthRuleToNode(node: any, rule: any) {
  if (!hasAuthDirectives(node)) {
    const authDirArgs = createArgumentNode('rules', createListValueNode([rule]));
    const authDir = createDirectiveNode('auth', [authDirArgs]);
    node.directives.push(authDir);
  } else {
    const authRules = getAuthRules(node);
    if (authRules) {
      authRules.push(rule);
    }
  }
}

function getAuthStrategy(rule: any) {
  return rule.fields.find((f: any) => f.name.value === 'allow').value.value
}

function getAuthOperations(rule: any) {
  return rule.fields.find((f: any) => f.name.value === 'operations')
    ?.value.values.map((op: any) => op.value)
    ?? ["create", "read", "update", "delete"]
}

export const defaultProviderMap: Map<string, string> = new Map<string, string>([
  ['public', 'apiKey'],
  ['private', 'userPools'],
  ['owner', 'userPools'],
  ['groups', 'userPools']
]);

function getAuthProvider(rule: any) {
  return rule.fields.find((f: any) => f.name.value === 'provider')
    ?.value.value
    ?? defaultProviderMap.get(getAuthStrategy(rule));
}

function getAuthRuleWithSameScopeIndex(rules: any[], rule: any) {
  let sameRule;
  rules.forEach((r, index) => {
    if (getAuthStrategy(r) === getAuthStrategy(rule) && getAuthProvider(r) === getAuthProvider(rule)) {
      sameRule = index
    }
  })
  return sameRule
}

function mergeOperations(a: any, b: any) {
  const aOps = getAuthOperations(a)
  const bOps = getAuthOperations(b)

  const operationsUnion = new Set([aOps, bOps].flat())

  return Array.from(operationsUnion)
}

function mergeAuthRules(node: any, rules: any[]) {
  const newRules = rules.reduce((result, rule) => {
    const existingRuleIndex = getAuthRuleWithSameScopeIndex(result, rule);
    if (existingRuleIndex !== undefined) {
      result[existingRuleIndex] = createAuthRule(getAuthStrategy(rule), getAuthProvider(rule), mergeOperations(result[existingRuleIndex], rule));
    } else {
      result.push(rule);
    }
    return result;
  }, [])

  setAuthRules(node, newRules.map((r: any) => createAuthRule(getAuthStrategy(r), getAuthProvider(r), getAuthOperations(r))));
}

export function migrateAuth(node: any, defaultAuthMode: any) {
  if (!isModelType(node)) {
    return;
  }

  migrateFieldAuth(node);

  if (hasAuthDirectives(node)) {
    migrateOwnerAuth(node, defaultAuthMode);
  }

  migrateDefaultAuthMode(node, defaultAuthMode);

  mergeAuthRules(node, getAuthRules(node));
}
