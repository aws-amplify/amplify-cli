import { FieldDefinitionNode } from 'graphql';
import {
  compoundExpression,
  Expression,
  obj,
  printBlock,
  and,
  equals,
  iff,
  methodCall,
  not,
  ref,
  str,
  bool,
  forEach,
  list,
  ObjectNode,
  qref,
  raw,
  set,
} from 'graphql-mapping-template';
import { getIdentityClaimExp, getOwnerClaim, apiKeyExpression, iamExpression, emptyPayload } from './helpers';
import {
  COGNITO_AUTH_TYPE,
  OIDC_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
  ConfiguredAuthProviders,
  IS_AUTHORIZED_FLAG,
  fieldIsList,
  NONE_VALUE,
} from '../utils';

const generateStaticRoleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  const staticRoleExpression: Array<Expression> = [];
  let privateRoleIdx = roles.findIndex(r => r.strategy === 'private');
  if (privateRoleIdx > -1) {
    staticRoleExpression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
    roles.splice(privateRoleIdx, 1);
  }
  if (roles.length > 0) {
    staticRoleExpression.push(
      iff(
        not(ref(IS_AUTHORIZED_FLAG)),
        compoundExpression([
          set(ref('staticGroupRoles'), raw(JSON.stringify(roles.map(r => ({ claim: r.claim, entity: r.entity }))))),
          forEach(ref('groupRole'), ref('staticGroupRoles'), [
            set(ref('groupsInToken'), getIdentityClaimExp(ref('groupRole.claim'), list([]))),
            iff(
              methodCall(ref('groupsInToken.contains'), ref('groupRole.entity')),
              compoundExpression([
                set(ref(IS_AUTHORIZED_FLAG), bool(true)),
                qref(methodCall(ref('ctx.stash.remove'), str('authFilter'))),
                raw(`#break`),
              ]),
            ),
          ]),
        ]),
      ),
    );
  }
  return staticRoleExpression;
};

const generateAuthFilter = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>): Array<Expression> => {
  const authFilter = new Array<ObjectNode>();
  if (!(roles.length > 0)) return [];
  /**
   * if ownerField is string
   * ownerField: { eq: "cognito:owner" }
   * if ownerField is a List
   * ownerField: { contains: "cognito:owner"}
   *
   * if groupsField is a string
   * groupsField: { in: "cognito:groups" }
   * if groupsField is a list
   * groupsField: { contains: "cognito:groups" }
   *  */
  for (let role of roles) {
    const entityIsList = fieldIsList(fields, role.entity!);
    if (role.strategy === 'owner') {
      const ownerCondition = entityIsList ? 'contains' : 'eq';
      authFilter.push(obj({ [role.entity!]: obj({ [ownerCondition]: getOwnerClaim(role.claim!) }) }));
    }
    if (role.strategy === 'groups') {
      const groupsCondition = entityIsList ? 'contains' : 'in';
      authFilter.push(obj({ [role.entity!]: obj({ [groupsCondition]: getIdentityClaimExp(str(role.claim!), list([str(NONE_VALUE)])) }) }));
    }
  }
  return [
    iff(
      not(ref(IS_AUTHORIZED_FLAG)),
      qref(methodCall(ref('ctx.stash.put'), str('authFilter'), authFilter.length > 1 ? obj({ or: list(authFilter) }) : list(authFilter))),
    ),
  ];
};

export const generateSearchAuthFilter = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>): void => {};

export const generateAuthExpressionForQueries = (
  provider: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
): string => {
  const { cogntoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, apiKeyRoles, iamRoles } = splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [set(ref(IS_AUTHORIZED_FLAG), bool(false))];
  if (provider.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (provider.hasIAM) {
    iamExpression(iamRoles, provider.hasAdminUIEnabled);
  }
  if (provider.hasUserPools) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(COGNITO_AUTH_TYPE)),
        compoundExpression([...generateAuthFilter(cognitoDynamicRoles, fields), ...generateStaticRoleExpression(cogntoStaticRoles)]),
      ),
    );
  }
  if (provider.hasOIDC) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([...generateAuthFilter(oidcDynamicRoles, fields), ...generateStaticRoleExpression(oidcStaticRoles)]),
      ),
    );
  }
  totalAuthExpressions.push(
    iff(
      and([not(ref(IS_AUTHORIZED_FLAG)), methodCall(ref('util.isNullOrEmpty'), methodCall(ref('ctx.stash.get'), str('authFilter')))]),
      ref('util.unauthorized()'),
    ),
  );
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, emptyPayload]));
};
