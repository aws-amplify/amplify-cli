import { getAuthRules, hasAuthDirectives, addAuthRuleToNode } from '.'
import { createAuthRule } from '../generators'

const defaultAuthModeMap: Map<string, string> = new Map<string, string>([
  ['apiKey', 'public'],
  ['iam', 'private'],
  ['userPools', 'private'],
  ['oidc', 'private']
]);

function getDefaultAuthRule(authMode: any, rules: any) {
  const parsedRules = rules.map((rule: any) => ({
    provider: rule.fields.find((r: any) => r.name.value === 'provider'),
    strategy: rule.fields.find((r: any) => r.name.value === 'allow')
  })).map((r: any) => ({
    strategy: r.strategy.value.value,
    provider: r.provider?.value?.value
  }));

  const foundRules = parsedRules.filter((r: any) => r.strategy === defaultAuthModeMap.get(authMode));
  if (foundRules.length === 0) {
    return null;
  }

  if (authMode === "iam" && foundRules.filter((r: any) => r.provider === 'iam').length !== 0) {
    return foundRules.find((r: any) => r.provider === 'iam');
  } else if (authMode === 'iam') {
    return null;
  }

  if (foundRules.filter((r: any) => r.provider === undefined || r.provider === authMode).length !== 0) {
    return foundRules.find((r: any) => r.provider === undefined || r.provider === authMode);
  }

  return null;
}

export function migrateDefaultAuthMode(node: any, defaultAuthMode: any) {
  if (defaultAuthMode === 'iam') {
    return;
  }

  if (!hasAuthDirectives(node)) {
    const authRule = createAuthRule(defaultAuthModeMap.get(defaultAuthMode), defaultAuthMode);
    addAuthRuleToNode(node, authRule);
    return;
  }

  const authRules = getAuthRules(node);

  // if rule with default auth mode exist, then don't mess with it otherwise add it
  const defaultAuthRule = getDefaultAuthRule(defaultAuthMode, authRules);
  if (!defaultAuthRule) {
    addAuthRuleToNode(node, createAuthRule(defaultAuthModeMap.get(defaultAuthMode), defaultAuthMode));
  }
}
