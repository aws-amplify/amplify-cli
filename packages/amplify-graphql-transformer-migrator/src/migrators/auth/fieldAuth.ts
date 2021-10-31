import { addAuthRuleToNode, getAuthRules, hasAuthDirectives } from "."

function getFieldsWithAuthRules(node: any) {
  return node.fields.filter((f: any) => hasAuthDirectives(f));
}

export function migrateFieldAuth(node: any) {
  const fieldWithAuthRules = getFieldsWithAuthRules(node);
  if (fieldWithAuthRules.length === 0) {
    return;
  }

  fieldWithAuthRules
    .map((f: any) => getAuthRules(f))
    .flat()
    .forEach((rule: any) => addAuthRuleToNode(node, rule));
}
