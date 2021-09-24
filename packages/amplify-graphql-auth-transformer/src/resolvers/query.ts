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
  qref,
  raw,
  set,
} from 'graphql-mapping-template';
import { getIdentityClaimExp, getOwnerClaim, apiKeyExpression, iamExpression, emptyPayload, setHasAuthExpression } from './helpers';
import {
  COGNITO_AUTH_TYPE,
  OIDC_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
  ConfiguredAuthProviders,
  IS_AUTHORIZED_FLAG,
  fieldIsList,
  QuerySource,
} from '../utils';
import { InvalidDirectiveError } from '@aws-amplify/graphql-transformer-core';
import { NONE_VALUE } from 'graphql-transformer-common';

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
              compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw(`#break`)]),
            ),
          ]),
        ]),
      ),
    );
  }
  return staticRoleExpression;
};

const generateAuthFilter = (
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
  querySource: QuerySource,
): Array<Expression> => {
  const authFilter = new Array<Expression>();
  const groupMap = new Map<string, Array<string>>();
  const groupContainsExpression = new Array<Expression>();
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
  if (querySource === 'dynamodb') {
    for (let role of roles) {
      const entityIsList = fieldIsList(fields, role.entity!);
      if (role.strategy === 'owner') {
        const ownerCondition = entityIsList ? 'contains' : 'eq';
        authFilter.push(obj({ [role.entity!]: obj({ [ownerCondition]: getOwnerClaim(role.claim!) }) }));
      }
      if (role.strategy === 'groups') {
        // for fields where the group is a list and the token is a list we must add every group in the claim
        if (entityIsList) {
          if (groupMap.has(role.claim!)) {
            groupMap.get(role.claim).push(role.entity);
          } else {
            groupMap.set(role.claim!, [role.entity]);
          }
        } else {
          authFilter.push(obj({ [role.entity!]: obj({ in: getIdentityClaimExp(str(role.claim!), list([str(NONE_VALUE)])) }) }));
        }
      }
    }
    for (let [groupClaim, fieldList] of groupMap) {
      groupContainsExpression.push(
        forEach(
          ref('group'),
          ref(`util.defaultIfNull($ctx.identity.claims.get("${groupClaim}"), ["${NONE_VALUE}"])`),
          fieldList.map(field => qref(methodCall(ref('authFilter.add'), raw(`{"${field}": { "contains": $group }}`)))),
        ),
      );
    }
    return [
      iff(
        not(ref(IS_AUTHORIZED_FLAG)),
        compoundExpression([
          set(ref('authFilter'), list(authFilter)),
          ...(groupContainsExpression.length > 0 ? groupContainsExpression : []),
          qref(methodCall(ref('ctx.stash.put'), str('authFilter'), raw('{ "or": $authFilter }'))),
        ]),
      ),
    ];
  }
  if (querySource === 'opensearch') {
    for (let role of roles) {
      let claimValue: Expression;
      if (role.strategy === 'owner') {
        claimValue = getOwnerClaim(role.claim!);
        authFilter.push(
          obj({
            terms_set: obj({
              [role.entity!]: obj({
                terms: list([claimValue]),
                minimum_should_match_script: obj({ source: str('1') }),
              }),
            }),
          }),
        );
      } else if (role.strategy === 'groups') {
        claimValue = getIdentityClaimExp(str(role.claim!), list([str(NONE_VALUE)]));
        authFilter.push(
          obj({
            terms_set: obj({
              [role.entity!]: obj({
                terms: claimValue,
                minimum_should_match_script: obj({ source: str('1') }),
              }),
            }),
          }),
        );
      }
    }
    return [
      iff(
        not(ref(IS_AUTHORIZED_FLAG)),
        qref(methodCall(ref('ctx.stash.put'), str('authFilter'), obj({ bool: obj({ should: list(authFilter) }) }))),
      ),
    ];
  }
  throw new InvalidDirectiveError(`Could not generate an auth filter for a ${querySource} datasource.`);
};

export const generateAuthExpressionForQueries = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
  querySource: QuerySource = 'dynamodb',
): string => {
  const { cogntoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, apiKeyRoles, iamRoles } = splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [setHasAuthExpression, set(ref(IS_AUTHORIZED_FLAG), bool(false))];
  if (providers.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (providers.hasIAM) {
    totalAuthExpressions.push(iamExpression(iamRoles, providers.hasAdminUIEnabled, providers.adminUserPoolID));
  }
  if (providers.hasUserPools) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(COGNITO_AUTH_TYPE)),
        compoundExpression([
          ...generateStaticRoleExpression(cogntoStaticRoles),
          ...generateAuthFilter(cognitoDynamicRoles, fields, querySource),
        ]),
      ),
    );
  }
  if (providers.hasOIDC) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([
          ...generateAuthFilter(oidcDynamicRoles, fields, querySource),
          ...generateStaticRoleExpression(oidcStaticRoles),
        ]),
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
