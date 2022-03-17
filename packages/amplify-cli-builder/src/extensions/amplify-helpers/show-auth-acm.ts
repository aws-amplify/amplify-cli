import {
  AccessControlMatrix,
  AuthRule,
  ModelOperation,
  MODEL_OPERATIONS,
  DEFAULT_GROUPS_FIELD,
  DEFAULT_OWNER_FIELD,
  getAuthDirectiveRules,
} from '@aws-amplify/graphql-auth-transformer';
import { parse, ObjectTypeDefinitionNode, DirectiveNode, FieldDefinitionNode } from 'graphql';
import { printer } from 'amplify-prompts';
import { DirectiveWrapper } from '@aws-amplify/graphql-transformer-core';

export function showACM(sdl: string, nodeName: string) {
  const schema = parse(sdl);
  const type = schema.definitions.find(
    node =>
      node.kind === 'ObjectTypeDefinition' && node.name.value === nodeName && node?.directives?.find(dir => dir.name.value === 'model'),
  ) as ObjectTypeDefinitionNode;
  if (!type) {
    throw new Error(`Model "${nodeName}" does not exist.`);
  } else {
    const fields: string[] = type.fields!.map((field: FieldDefinitionNode) => field.name.value);
    const acm = new AccessControlMatrix({ name: type.name.value, operations: MODEL_OPERATIONS, resources: fields });
    const parentAuthDirective = type.directives?.find(dir => dir.name.value === 'auth');
    if (parentAuthDirective) {
      const authRules: AuthRule[] = getAuthDirectiveRules(new DirectiveWrapper(parentAuthDirective));
      convertModelRulesToRoles(acm, authRules);
    }
    for (let fieldNode of type.fields || []) {
      let fieldAuthDir = fieldNode.directives?.find(dir => dir.name.value === 'auth') as DirectiveNode;
      if (fieldAuthDir) {
        if (parentAuthDirective) {
          acm.resetAccessForResource(fieldNode.name.value);
        }
        const authRules: AuthRule[] = getAuthDirectiveRules(new DirectiveWrapper(fieldAuthDir));
        convertModelRulesToRoles(acm, authRules, fieldNode.name.value);
      }
    }
    const truthTable = acm.getAcmPerRole();

    if (truthTable.size === 0) {
      printer.warn(`No auth rules have been configured for the "${type.name.value}" model.`);
    }

    for (let [role, acm] of truthTable) {
      console.group(role);
      console.table(acm);
      console.groupEnd();
    }
  }
}

function convertModelRulesToRoles(acm: AccessControlMatrix, authRules: AuthRule[], field?: string) {
  for (let rule of authRules) {
    let operations: ModelOperation[] = rule.operations || MODEL_OPERATIONS;
    if (rule.groups && !rule.groupsField) {
      rule.groups.forEach(group => {
        let roleName = `${rule.provider}:staticGroup:${group}`;
        acm.setRole({ role: roleName, resource: field, operations });
      });
    } else {
      let roleName: string;
      switch (rule.provider) {
        case 'apiKey':
          roleName = 'apiKey:public';
          break;
        case 'iam':
          roleName = `iam:${rule.allow}`;
          break;
        case 'oidc':
        case 'userPools':
          if (rule.allow === 'groups') {
            let groupsField = rule.groupsField || DEFAULT_GROUPS_FIELD;
            roleName = `${rule.provider}:dynamicGroup:${groupsField}`;
          } else if (rule.allow === 'owner') {
            let ownerField = rule.ownerField || DEFAULT_OWNER_FIELD;
            roleName = `${rule.provider}:owner:${ownerField}`;
          } else if (rule.allow === 'private') {
            roleName = `${rule.provider}:${rule.allow}`;
          } else {
            throw new Error(`Could not create a role from ${JSON.stringify(rule)}`);
          }
          break;
        default:
          throw new Error(`Could not create a role from ${JSON.stringify(rule)}`);
      }
      acm.setRole({ role: roleName, resource: field, operations });
    }
  }
}
