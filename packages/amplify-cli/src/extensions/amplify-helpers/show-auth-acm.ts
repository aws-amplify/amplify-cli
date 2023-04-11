import {
  AccessControlMatrix,
  AuthRule,
  ModelOperation,
  MODEL_OPERATIONS,
  DEFAULT_GROUPS_FIELD,
  DEFAULT_GROUP_CLAIM,
  DEFAULT_OWNER_FIELD,
  getAuthDirectiveRules,
} from '@aws-amplify/graphql-auth-transformer';
import { parse, ObjectTypeDefinitionNode, DirectiveNode, FieldDefinitionNode } from 'graphql';
import { printer } from '@aws-amplify/amplify-prompts';
import { DirectiveWrapper } from '@aws-amplify/graphql-transformer-core';
import { FeatureFlags } from '@aws-amplify/amplify-cli-core';

export function showACM(sdl: string, nodeName: string) {
  const schema = parse(sdl);
  const type = schema.definitions.find(
    (node) =>
      node.kind === 'ObjectTypeDefinition' && node.name.value === nodeName && node?.directives?.find((dir) => dir.name.value === 'model'),
  ) as ObjectTypeDefinitionNode;
  if (!type) {
    throw new Error(`Model "${nodeName}" does not exist.`);
  } else {
    const fields: string[] = type.fields!.map((field: FieldDefinitionNode) => field.name.value);
    const acm = new AccessControlMatrix({ name: type.name.value, operations: MODEL_OPERATIONS, resources: fields });
    const parentAuthDirective = type.directives?.find((dir) => dir.name.value === 'auth');
    if (parentAuthDirective) {
      const authRules: AuthRule[] = getAuthDirectiveRules(new DirectiveWrapper(parentAuthDirective), {
        isField: false,
        deepMergeArguments: FeatureFlags.getBoolean('graphqltransformer.shouldDeepMergeDirectiveConfigDefaults'),
      });
      convertModelRulesToRoles(acm, authRules);
    }
    for (const fieldNode of type.fields || []) {
      const fieldAuthDir = fieldNode.directives?.find((dir) => dir.name.value === 'auth') as DirectiveNode;
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

    for (const [role, acm] of truthTable) {
      console.group(role);
      console.table(acm);
      console.groupEnd();
    }
  }
}

function convertModelRulesToRoles(acm: AccessControlMatrix, authRules: AuthRule[], field?: string) {
  for (const rule of authRules) {
    const operations: ModelOperation[] = rule.operations || MODEL_OPERATIONS;
    if (rule.groups && !rule.groupsField) {
      rule.groups.forEach((group) => {
        const roleName = `${rule.provider}:staticGroup:${group}`;
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
            const groupsField = rule.groupsField || DEFAULT_GROUPS_FIELD;
            const groupsClaim = rule.groupClaim || DEFAULT_GROUP_CLAIM;
            roleName = `${rule.provider}:dynamicGroup:${groupsClaim}:${groupsField}`;
          } else if (rule.allow === 'owner') {
            const ownerField = rule.ownerField || DEFAULT_OWNER_FIELD;
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
