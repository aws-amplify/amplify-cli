import {
  AccessControlMatrix,
  AuthRule,
  ModelOperation,
  MODEL_OPERATIONS,
  DEFAULT_GROUPS_FIELD,
  DEFAULT_OWNER_FIELD,
} from '@aws-amplify/graphql-auth-transformer';
import { parse, ObjectTypeDefinitionNode, ArgumentNode, DirectiveNode, valueFromASTUntyped, FieldDefinitionNode } from 'graphql';
import { printer } from 'amplify-prompts';

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
      const authRules = getAuthRulesFromDirective(parentAuthDirective);
      ensureAuthRuleDefaults(authRules);
      convertModelRulesToRoles(acm, authRules);
    }
    for (let fieldNode of type.fields || []) {
      let fieldAuthDir = fieldNode.directives?.find(dir => dir.name.value === 'auth') as DirectiveNode;
      if (fieldAuthDir) {
        if (parentAuthDirective) {
          acm.resetAccessForResource(fieldNode.name.value);
        }
        let fieldAuthRules = getAuthRulesFromDirective(fieldAuthDir);
        ensureAuthRuleDefaults(fieldAuthRules);
        convertModelRulesToRoles(acm, fieldAuthRules, fieldNode.name.value);
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
// helper functions for setting up acm
function getAuthRulesFromDirective(directive: DirectiveNode) {
  const get = (s: string) => (arg: ArgumentNode) => arg.name.value === s;
  const getArg = (arg: string, dflt?: any) => {
    const argument = directive.arguments?.find(get(arg));
    return argument ? valueFromASTUntyped(argument.value) : dflt;
  };

  // Get and validate the auth rules.
  const authRules = getArg('rules', []) as AuthRule[];

  // All the IAM auth rules that are added using @auth directive need IAM policy to be generated. AuthRules added for AdminUI don't
  return authRules.map(rule => (rule.provider === 'iam' ? { ...rule, generateIAMPolicy: true } : rule));
}

function ensureAuthRuleDefaults(rules: AuthRule[]) {
  // We assign the default provider if an override is not present make further handling easier.
  for (const rule of rules) {
    if (!rule.provider) {
      switch (rule.allow) {
        case 'owner':
        case 'groups':
          rule.provider = 'userPools';
          break;
        case 'private':
          rule.provider = 'userPools';
          break;
        case 'public':
          rule.provider = 'apiKey';
          break;
        default:
          rule.provider = undefined;
          break;
      }
    }
    if (rule.provider === 'iam') {
      rule.generateIAMPolicy = true;
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
