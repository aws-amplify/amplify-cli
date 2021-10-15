import { addAuthRuleToNode, getAuthRules, hasAuthDirectives } from "."

function hasFieldAuthRules(node: any) {
  return getFieldsWithAuthRules(node).length !== 0
}

function getFieldsWithAuthRules(node: any) {
  return node.fields.filter((f: any) => hasAuthDirectives(f))
}

export function migrateFieldAuth(node: any) {
  if (!hasFieldAuthRules(node)) {
    return;
  }

  const fieldWithAuthRules = getFieldsWithAuthRules(node)
  fieldWithAuthRules
    .map((f: any) => getAuthRules(f))
    .flat()
    .forEach((rule: any) => addAuthRuleToNode(node, rule));
}
