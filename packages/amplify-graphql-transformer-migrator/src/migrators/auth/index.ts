import { isModelType } from '../model';
import { migrateDefaultAuthMode } from './defaultAuth';
import { migrateFieldAuth } from './fieldAuth';
import { migrateOwnerAuth } from './ownerAuth';
import { createArgumentNode, createDirectiveNode, createListValueNode } from '../generators';

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
    const valueNode = createListValueNode([rule]);
    const authDirArgs = createArgumentNode('rules', valueNode);
    const authDir = createDirectiveNode('auth', [authDirArgs]);
    node.directives.push(authDir);
  } else {
    const authRules = getAuthRules(node);
    if (authRules) {
      authRules.push(rule);
    }
  }
}

export const defaultProviderMap: Map<string, string> = new Map<string, string>([
  ['public', 'apiKey'],
  ['private', 'userPools'],
  ['owner', 'userPools'],
  ['groups', 'userPools'],
]);

export function migrateAuth(node: any, defaultAuthMode: any) {
  if (!isModelType(node)) {
    return;
  }

  migrateFieldAuth(node);

  if (hasAuthDirectives(node)) {
    migrateOwnerAuth(node, defaultAuthMode);
  }

  migrateDefaultAuthMode(node, defaultAuthMode);
}
