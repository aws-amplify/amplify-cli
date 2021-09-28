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
  ifElse,
  nul,
} from 'graphql-mapping-template';
import { getIdentityClaimExp, getOwnerClaim, apiKeyExpression, iamExpression, lambdaExpression, emptyPayload, setHasAuthExpression } from './helpers';
import {
  COGNITO_AUTH_TYPE,
  OIDC_AUTH_TYPE,
  LAMBDA_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
  ConfiguredAuthProviders,
  IS_AUTHORIZED_FLAG,
  fieldIsList,
  RelationalPrimaryMapConfig,
} from '../utils';
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

const generateAuthOnRelationalModelQueryExpression = (
  roles: Array<RoleDefinition>,
  primaryFieldMap: RelationalPrimaryMapConfig,
): Array<Expression> => {
  const modelQueryExpression = new Array<Expression>();
  const primaryRoles = roles.filter(r => primaryFieldMap.has(r.entity));
  if (primaryRoles.length > 0) {
    primaryRoles.forEach((role, idx) => {
      const { claim, field } = primaryFieldMap.get(role.entity);
      modelQueryExpression.push(
        set(
          ref(`primaryRole${idx}`),
          role.strategy === 'owner' ? getOwnerClaim(role.claim!) : getIdentityClaimExp(str(role.claim!), str(NONE_VALUE)),
        ),
        ifElse(
          not(ref(`util.isNull($ctx.${claim}.${field})`)),
          compoundExpression([
            iff(
              equals(ref(`ctx.${claim}.${field}`), ref(`primaryRole${idx}`)),
              compoundExpression([
                set(ref(IS_AUTHORIZED_FLAG), bool(true)),
                qref(methodCall(ref('ctx.stash.put'), str('authFilter'), nul())),
              ]),
            ),
          ]),
          iff(
            not(ref(IS_AUTHORIZED_FLAG)),
            compoundExpression([
              qref(methodCall(ref(`ctx.${claim}.put`), str(field), ref(`primaryRole${idx}`))),
              set(ref('primaryFieldAuth'), bool(true)),
            ]),
          ),
        ),
      );
    });
    return [
      iff(
        and([not(ref(IS_AUTHORIZED_FLAG)), methodCall(ref('util.isNull'), ref('ctx.stash.authFilter'))]),
        compoundExpression(modelQueryExpression),
      ),
    ];
  }
  return modelQueryExpression;
};

/**
 * In the event that an owner/group field is the same as a primary field we can validate against the args if provided
 * if the field is not in the args we include it in the KeyConditionExpression which is formed as a part of the query
 */
const generateAuthOnModelQueryExpression = (
  roles: Array<RoleDefinition>,
  primaryFields: Array<string>,
  isIndexQuery = false,
): Array<Expression> => {
  const modelQueryExpression = new Array<Expression>();
  const primaryRoles = roles.filter(r => primaryFields.includes(r.entity));
  if (primaryRoles.length > 0) {
    if (isIndexQuery) {
      for (let role of primaryRoles) {
        const claimExpression =
          role.strategy === 'owner' ? getOwnerClaim(role.claim!) : getIdentityClaimExp(str(role.claim!), str(NONE_VALUE));
        modelQueryExpression.push(
          ifElse(
            not(ref(`util.isNull($ctx.args.${role.entity})`)),
            iff(
              equals(ref(`ctx.args.${role.entity}`), claimExpression),
              compoundExpression([
                set(ref(IS_AUTHORIZED_FLAG), bool(true)),
                qref(methodCall(ref('ctx.stash.put'), str('authFilter'), nul())),
              ]),
            ),
            qref(methodCall(ref('primaryFieldMap.put'), str(role.entity), claimExpression)),
          ),
        );
      }
      modelQueryExpression.push(
        iff(
          and([
            not(ref(IS_AUTHORIZED_FLAG)),
            methodCall(ref('util.isNull'), ref('ctx.stash.authFilter')),
            not(ref('primaryFieldMap.isEmpty()')),
          ]),
          compoundExpression([
            forEach(ref('entry'), ref('primaryFieldMap.entrySet()'), [
              qref(methodCall(ref('ctx.args.put'), ref('entry.key'), ref('entry.value'))),
            ]),
          ]),
        ),
      );
    } else {
      for (let role of primaryRoles) {
        const claimExpression =
          role.strategy === 'owner' ? getOwnerClaim(role.claim!) : getIdentityClaimExp(str(role.claim!), str(NONE_VALUE));
        modelQueryExpression.push(
          ifElse(
            not(ref(`util.isNull($ctx.args.${role.entity})`)),
            compoundExpression([iff(equals(ref(`ctx.args.${role.entity}`), claimExpression), set(ref(IS_AUTHORIZED_FLAG), bool(true)))]),
            qref(methodCall(ref('primaryFieldMap.put'), str(role.entity), claimExpression)),
          ),
        );
      }
      modelQueryExpression.push(
        iff(
          and([
            not(ref(IS_AUTHORIZED_FLAG)),
            methodCall(ref('util.isNull'), ref('ctx.stash.authFilter')),
            not(ref('primaryFieldMap.isEmpty()')),
          ]),
          compoundExpression([
            set(ref('modelQueryExpression'), ref('ctx.stash.modelQueryExpression')),
            forEach(ref('entry'), ref('primaryFieldMap.entrySet()'), [
              set(ref('modelQueryExpression.expression'), str('${modelQueryExpression.expression} AND #${entry.key} = :${entry.value}')),
              qref(ref('modelQueryExpression.expressionNames.put("#${entry.key}", $entry.key)')),
              qref(ref('modelQueryExpression.expressionValues.put(":${entry.value}", $util.dynamodb.toDynamoDB($entry.value))')),
            ]),
            qref(methodCall(ref('ctx.stash.put'), str('modelQueryExpression'), ref('modelQueryExpression'))),
          ]),
        ),
      );
    }
    return modelQueryExpression;
  }
  return [];
};

const generateAuthFilter = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>): Array<Expression> => {
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
   * we create contains experession for each cognito group
   *  */
  for (let role of roles) {
    const entityIsList = fieldIsList(fields, role.entity);
    if (role.strategy === 'owner') {
      const ownerCondition = entityIsList ? 'contains' : 'eq';
      authFilter.push(obj({ [role.entity]: obj({ [ownerCondition]: getOwnerClaim(role.claim!) }) }));
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
        authFilter.push(obj({ [role.entity]: obj({ in: getIdentityClaimExp(str(role.claim!), list([str(NONE_VALUE)])) }) }));
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
};

export const generateAuthExpressionForQueries = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
  primaryFields: Array<string>,
  isIndexQuery = false,
): string => {
  const { cogntoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, apiKeyRoles, iamRoles, lambdaRoles } = splitRoles(roles);
  const getNonPrimaryFieldRoles = (roles: RoleDefinition[]) => roles.filter(roles => !primaryFields.includes(roles.entity));
  const totalAuthExpressions: Array<Expression> = [
    setHasAuthExpression,
    set(ref(IS_AUTHORIZED_FLAG), bool(false)),
    set(ref('primaryFieldMap'), obj({})),
  ];
  if (providers.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (providers.hasLambda) {
    totalAuthExpressions.push(lambdaExpression(lambdaRoles));
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
          ...generateAuthFilter(getNonPrimaryFieldRoles(cognitoDynamicRoles), fields),
          ...generateAuthOnModelQueryExpression(cognitoDynamicRoles, primaryFields, isIndexQuery),
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
          ...generateAuthFilter(getNonPrimaryFieldRoles(oidcDynamicRoles), fields),
          ...generateAuthOnModelQueryExpression(oidcDynamicRoles, primaryFields, isIndexQuery),
        ]),
      ),
    );
  }
  totalAuthExpressions.push(
    iff(
      and([not(ref(IS_AUTHORIZED_FLAG)), methodCall(ref('util.isNull'), ref('ctx.stash.authFilter')), ref('primaryFieldMap.isEmpty()')]),
      ref('util.unauthorized()'),
    ),
  );
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, emptyPayload]));
};

export const generateAuthExpressionForRelationQuery = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
  primaryFieldMap: RelationalPrimaryMapConfig,
) => {
  const { cogntoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, apiKeyRoles, iamRoles, lambdaRoles } = splitRoles(roles);
  const getNonPrimaryFieldRoles = (roles: RoleDefinition[]) => roles.filter(roles => !primaryFieldMap.has(roles.entity));
  const totalAuthExpressions: Array<Expression> = [
    setHasAuthExpression,
    set(ref(IS_AUTHORIZED_FLAG), bool(false)),
    set(ref('primaryFieldAuth'), bool(false)),
  ];
  if (providers.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (providers.hasLambda) {
    totalAuthExpressions.push(lambdaExpression(lambdaRoles));
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
          ...generateAuthFilter(getNonPrimaryFieldRoles(cognitoDynamicRoles), fields),
          ...generateAuthOnRelationalModelQueryExpression(cognitoDynamicRoles, primaryFieldMap),
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
          ...generateAuthFilter(getNonPrimaryFieldRoles(oidcDynamicRoles), fields),
          ...generateAuthOnRelationalModelQueryExpression(oidcDynamicRoles, primaryFieldMap),
        ]),
      ),
    );
  }
  totalAuthExpressions.push(
    iff(
      and([not(ref(IS_AUTHORIZED_FLAG)), methodCall(ref('util.isNull'), ref('ctx.stash.authFilter')), not(ref('primaryFieldAuth'))]),
      ref('util.unauthorized()'),
    ),
  );
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, emptyPayload]));
};
