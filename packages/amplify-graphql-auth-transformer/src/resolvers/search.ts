import { FieldDefinitionNode } from 'graphql';
import {
  compoundExpression,
  Expression,
  obj,
  printBlock,
  and,
  equals,
  notEquals,
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
  ifElse,
} from 'graphql-mapping-template';
import { NONE_VALUE } from 'graphql-transformer-common';
import {
  getIdentityClaimExp,
  getOwnerClaim,
  emptyPayload,
  setHasAuthExpression,
  iamCheck,
  iamAdminRoleCheckExpression,
  generateOwnerClaimExpression,
  generateOwnerClaimListExpression,
} from './helpers';
import {
  COGNITO_AUTH_TYPE,
  OIDC_AUTH_TYPE,
  LAMBDA_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
  ConfiguredAuthProviders,
  IS_AUTHORIZED_FLAG,
  fieldIsList,
  API_KEY_AUTH_TYPE,
  IAM_AUTH_TYPE,
} from '../utils';

const allowedAggFieldsList = 'allowedAggFields';
const aggFieldsFilterMap = 'aggFieldsFilterMap';
const totalFields = 'totalFields';

const apiKeyExpression = (roles: Array<RoleDefinition>): Expression => {
  const expression = Array<Expression>();
  if (roles.length === 0) {
    expression.push(ref('util.unauthorized()'));
  } else if (roles[0].allowedFields) {
    expression.push(
      set(ref(IS_AUTHORIZED_FLAG), bool(true)),
      qref(methodCall(ref(`${allowedAggFieldsList}.addAll`), raw(JSON.stringify(roles[0].allowedFields)))),
    );
  } else {
    expression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)), set(ref(allowedAggFieldsList), ref(totalFields)));
  }
  return iff(equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)), compoundExpression(expression));
};

const lambdaExpression = (roles: Array<RoleDefinition>): Expression => {
  const expression = Array<Expression>();
  if (roles.length === 0) {
    expression.push(ref('util.unauthorized()'));
  } else if (roles[0].allowedFields) {
    expression.push(
      set(ref(IS_AUTHORIZED_FLAG), bool(true)),
      qref(methodCall(ref(`${allowedAggFieldsList}.addAll`), raw(JSON.stringify(roles[0].allowedFields)))),
    );
  } else {
    expression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)), set(ref(allowedAggFieldsList), ref(totalFields)));
  }
  return iff(equals(ref('util.authType()'), str(LAMBDA_AUTH_TYPE)), compoundExpression(expression));
};

const iamExpression = (
  roles: Array<RoleDefinition>,
  hasAdminRolesEnabled = false,
  adminRoles: Array<string> = [],
  identityPoolId?: string,
): Expression => {
  const expression = new Array<Expression>();
  // allow if using an admin role
  if (hasAdminRolesEnabled) {
    expression.push(iamAdminRoleCheckExpression(adminRoles));
  }
  if (roles.length === 0) {
    expression.push(ref('util.unauthorized()'));
  } else {
    roles.forEach(role => {
      const exp: Expression[] = [set(ref(IS_AUTHORIZED_FLAG), bool(true))];
      if (role.allowedFields) {
        exp.push(qref(methodCall(ref(`${allowedAggFieldsList}.addAll`), raw(JSON.stringify(role.allowedFields)))));
      } else {
        exp.push(set(ref(allowedAggFieldsList), ref(totalFields)));
      }
      expression.push(iff(not(ref(IS_AUTHORIZED_FLAG)), iamCheck(role.claim!, compoundExpression(exp), identityPoolId)));
    });
  }
  return iff(equals(ref('util.authType()'), str(IAM_AUTH_TYPE)), compoundExpression(expression));
};

const generateStaticRoleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  const staticRoleExpression: Array<Expression> = [];
  const privateRoleIdx = roles.findIndex(r => r.strategy === 'private');
  if (privateRoleIdx > -1) {
    if (roles[privateRoleIdx].allowedFields) {
      staticRoleExpression.push(
        qref(methodCall(ref(`${allowedAggFieldsList}.addAll`), raw(JSON.stringify(roles[privateRoleIdx].allowedFields)))),
      );
    } else {
      staticRoleExpression.push(set(ref(allowedAggFieldsList), ref(totalFields)));
    }
    staticRoleExpression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
    roles.splice(privateRoleIdx, 1);
  }
  if (roles.length > 0) {
    staticRoleExpression.push(
      iff(
        not(ref(IS_AUTHORIZED_FLAG)),
        compoundExpression([
          set(
            ref('staticGroupRoles'),
            raw(
              JSON.stringify(
                roles.map(r => ({ claim: r.claim, entity: r.entity, ...(r.allowedFields ? { allowedFields: r.allowedFields } : {}) })),
              ),
            ),
          ),
          forEach(ref('groupRole'), ref('staticGroupRoles'), [
            set(ref('groupsInToken'), getIdentityClaimExp(ref('groupRole.claim'), list([]))),
            iff(
              methodCall(ref('groupsInToken.contains'), ref('groupRole.entity')),
              compoundExpression([
                set(ref(IS_AUTHORIZED_FLAG), bool(true)),
                ifElse(
                  methodCall(ref('util.isNull'), ref('groupRole.allowedFields')),
                  compoundExpression([set(ref(allowedAggFieldsList), ref(totalFields)), raw('#break')]),
                  qref(methodCall(ref(`${allowedAggFieldsList}.addAll`), ref('groupRole.allowedFields'))),
                ),
              ]),
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
  allowedAggFields: Array<string>,
): Array<Expression> => {
  const filterExpression = new Array<Expression>();
  const authFilter = new Array<Expression>();
  const aggFieldMap: Record<string, Array<string>> = {};
  if (!(roles.length > 0)) return [];
  /**
   * for opensearch
   * we create a terms_set where the field (role.entity) has to match at least element in the terms
   * if the field is a list it will look for a subset of elements in the list which should exist in the terms list
   *  */
  roles.forEach((role, idx) => {
    // for the terms search it's best to go by keyword for non list dynamic auth fields
    const entityIsList = fieldIsList(fields, role.entity);
    const roleKey = entityIsList ? role.entity : `${role.entity}.keyword`;
    if (role.strategy === 'owner') {
      const claims = role.claim!.split(':');
      const hasMultiClaims = claims.length > 1 && role.claim! !== 'cognito:username';

      if (hasMultiClaims) {
        filterExpression.push(
          generateOwnerClaimExpression(role.claim!, `ownerClaim${idx}`),
          generateOwnerClaimListExpression(role.claim!, idx),
          qref(methodCall(ref(`ownerClaimsList${idx}.add`), ref(`ownerClaim${idx}`))),
          set(
            ref(`owner${idx}`),
            obj({
              terms_set: obj({
                [roleKey]: obj({
                  terms: ref(`ownerClaimsList${idx}`),
                  minimum_should_match_script: obj({ source: str('1') }),
                }),
              }),
            }),
          ),
        );
      } else {
        filterExpression.push(
          set(
            ref(`owner${idx}`),
            obj({
              terms_set: obj({
                [roleKey]: obj({
                  terms: list([getOwnerClaim(role.claim!)]),
                  minimum_should_match_script: obj({ source: str('1') }),
                }),
              }),
            }),
          ),
        );
      }

      authFilter.push(ref(`owner${idx}`));

      if (role.allowedFields) {
        role.allowedFields.forEach(field => {
          if (!allowedAggFields.includes(field)) {
            aggFieldMap[field] = [...(aggFieldMap[field] ?? []), `$owner${idx}`];
          }
        });
      }
    } else if (role.strategy === 'groups') {
      filterExpression.push(
        set(
          ref(`group${idx}`),
          obj({
            terms_set: obj({
              [roleKey]: obj({
                terms: getIdentityClaimExp(str(role.claim!), list([str(NONE_VALUE)])),
                minimum_should_match_script: obj({ source: str('1') }),
              }),
            }),
          }),
        ),
      );
      authFilter.push(ref(`group${idx}`));
      if (role.allowedFields) {
        role.allowedFields.forEach(field => {
          if (!allowedAggFields.includes(field)) {
            aggFieldMap[field] = [...(aggFieldMap[field] ?? []), `$group${idx}`];
          }
        });
      }
    }
  });
  filterExpression.push(
    iff(
      not(ref(IS_AUTHORIZED_FLAG)),
      qref(methodCall(ref('ctx.stash.put'), str('authFilter'), obj({ bool: obj({ should: list(authFilter) }) }))),
    ),
  );
  if (Object.keys(aggFieldMap).length > 0) {
    filterExpression.push(
      iff(
        notEquals(ref(`${allowedAggFieldsList}.size()`), ref(`${totalFields}.size()`)),
        // regex is there so we can remove the quotes from the array values in VTL as they contain objects
        // ex. "$owner0" to $owner0
        qref(methodCall(ref('ctx.stash.put'), str(aggFieldsFilterMap), raw(JSON.stringify(aggFieldMap).replace(/"\$(.*?)"/g, '$$$1')))),
      ),
    );
  }
  return filterExpression;
};

/**
 * creates the auth expression for searchable
 * - handles object level search query
 * - creates field auth expression for aggregation query
 */
export const generateAuthExpressionForSearchQueries = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
  allowedAggFields: Array<string>,
): string => {
  const {
    cognitoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, apiKeyRoles, iamRoles, lambdaRoles,
  } = splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [
    setHasAuthExpression,
    set(ref(IS_AUTHORIZED_FLAG), bool(false)),
    set(ref(totalFields), raw(JSON.stringify(fields.map(f => f.name.value)))),
    set(ref(allowedAggFieldsList), raw(JSON.stringify(allowedAggFields))),
  ];
  if (providers.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (providers.hasLambda) {
    totalAuthExpressions.push(lambdaExpression(lambdaRoles));
  }
  if (providers.hasIAM) {
    totalAuthExpressions.push(iamExpression(iamRoles, providers.hasAdminRolesEnabled, providers.adminRoles, providers.identityPoolId));
  }
  if (providers.hasUserPools) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(COGNITO_AUTH_TYPE)),
        compoundExpression([
          ...generateStaticRoleExpression(cognitoStaticRoles),
          ...generateAuthFilter(cognitoDynamicRoles, fields, allowedAggFields),
        ]),
      ),
    );
  }
  if (providers.hasOIDC) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([
          ...generateStaticRoleExpression(oidcStaticRoles),
          ...generateAuthFilter(oidcDynamicRoles, fields, allowedAggFields),
        ]),
      ),
    );
  }
  totalAuthExpressions.push(
    qref(methodCall(ref('ctx.stash.put'), str(allowedAggFieldsList), ref(allowedAggFieldsList))),
    iff(and([not(ref(IS_AUTHORIZED_FLAG)), methodCall(ref('util.isNull'), ref('ctx.stash.authFilter'))]), ref('util.unauthorized()')),
  );
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, emptyPayload]));
};
