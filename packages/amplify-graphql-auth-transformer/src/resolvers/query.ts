import { FieldDefinitionNode } from 'graphql';
import {
  compoundExpression,
  iff,
  raw,
  set,
  ref,
  forEach,
  bool,
  Expression,
  not,
  ObjectNode,
  obj,
  list,
  qref,
  equals,
  str,
  and,
  methodCall,
  toJson,
  printBlock,
  print,
  block,
  ifElse,
  nul,
} from 'graphql-mapping-template';
import { isListType, NONE_VALUE } from 'graphql-transformer-common';
import {
  COGNITO_AUTH_TYPE,
  OIDC_AUTH_TYPE,
  DEFAULT_COGNITO_IDENTITY_CLAIM,
  API_KEY_AUTH_TYPE,
  RoleDefinition,
  RolesByProvider,
} from '../utils';

// Generic Auth VTL Functions
const getIdentityClaimExp = (value: Expression, defaultValueExp: Expression) => {
  return methodCall(ref('util.defaultIfNull'), methodCall(ref('ctx.identity.claims.get'), value), defaultValueExp);
};

export const splitRoles = (roles: Array<RoleDefinition>): RolesByProvider => {
  return {
    cognitoStaticGroupRoles: roles.filter(r => r.static && r.provider === 'userPools'),
    cognitoDynamicRoles: roles.filter(r => !r.static && r.provider === 'userPools'),
    oidcStaticGroupRoles: roles.filter(r => r.static && r.provider === 'oidc'),
    oidcDynamicRoles: roles.filter(r => !r.static && r.provider === 'oidc'),
    apiKeyRoles: roles.filter(r => r.provider === 'apiKey'),
  };
};

export const staticRuleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  return [
    set(ref('staticGroupRoles'), raw(JSON.stringify(roles.map(r => ({ claim: r.claim, entity: r.entity }))))),
    forEach(/** for */ ref('groupRole'), /** in */ ref('staticGroupRoles'), [
      set(ref('groupsInToken'), getIdentityClaimExp(ref('groupRole.claim'), list([]))),
      iff(
        methodCall(ref('groupsInToken.contains'), ref('groupRole.entity')),
        compoundExpression([
          set(ref('isStaticAuthorized'), bool(true)),
          qref(methodCall(ref('ctx.stash.remove'), str('authFilter'))),
          raw(`#break`),
        ]),
      ),
    ]),
  ];
};

/**
 * Behavior of auth v1
 * Order of how the owner value is retrieved from the jwt
 * if claim is username
 * 1. username
 * 2. cognito:username
 * 3. none value
 *
 * if claim is custom
 * 1. custom
 * 2. none value
 */
export const getOwnerExpression = (ownerClaim: string): Expression => {
  if (ownerClaim === 'username') {
    return getIdentityClaimExp(str(ownerClaim), getIdentityClaimExp(str(DEFAULT_COGNITO_IDENTITY_CLAIM), str(NONE_VALUE)));
  }
  return getIdentityClaimExp(str(ownerClaim), str(NONE_VALUE));
};

export const fieldIsList = (fields: ReadonlyArray<FieldDefinitionNode>, fieldName: string) => {
  const field = fields.find(field => field.name.value === fieldName);
  if (field) {
    return isListType(field.type);
  }
  return false;
};

// Query VTL Functions
export const generateAuthFilter = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>): Expression => {
  const authFilter = new Array<ObjectNode>();
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
      authFilter.push(obj({ [role.entity!]: obj({ [ownerCondition]: getOwnerExpression(role.claim!) }) }));
    }
    if (role.strategy === 'groups') {
      const groupsCondition = entityIsList ? 'contains' : 'in';
      authFilter.push(obj({ [role.entity!]: obj({ [groupsCondition]: getIdentityClaimExp(str(role.claim!), list([str(NONE_VALUE)])) }) }));
    }
  }
  return qref(methodCall(ref('ctx.stash.put'), str('authFilter'), obj({ or: list(authFilter) })));
};

export const jwtQueryAuthExpression = (
  provider: string,
  fields: ReadonlyArray<FieldDefinitionNode>,
  staticRoles: Array<RoleDefinition>,
  dynamicRoles: Array<RoleDefinition>,
): Expression | null => {
  const authExpressions = new Array<Expression>();
  if (dynamicRoles.length > 0) {
    authExpressions.push(generateAuthFilter(dynamicRoles, fields));
  }
  if (staticRoles.length > 0) {
    authExpressions.push(...staticRuleExpression(staticRoles));
  }
  if (authExpressions.length > 0) {
    authExpressions.push(
      iff(
        and([not(ref('isStaticAuthorized')), methodCall(ref('util.isNullOrEmpty'), methodCall(ref('ctx.stash.get'), str('authFilter')))]),
        ref('util.unauthorized()'),
      ),
    );
    return iff(equals(ref('util.authType()'), str(provider)), compoundExpression(authExpressions));
  }
  return null;
};

export const generateAuthExpressionForQueries = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>): string => {
  const { cognitoStaticGroupRoles, cognitoDynamicRoles, oidcStaticGroupRoles, oidcDynamicRoles } = splitRoles(roles);
  const totalAuthExpressions = Array<Expression>();
  const cognitoAuthExpression = jwtQueryAuthExpression(COGNITO_AUTH_TYPE, fields, cognitoStaticGroupRoles, cognitoDynamicRoles);
  const oidcAuthExpression = jwtQueryAuthExpression(OIDC_AUTH_TYPE, fields, oidcStaticGroupRoles, oidcDynamicRoles);
  if (cognitoAuthExpression) totalAuthExpressions.push(cognitoAuthExpression);
  if (oidcAuthExpression) totalAuthExpressions.push(oidcAuthExpression);
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, toJson(obj({}))]));
};

// Field Read VTL Functions
export const generateDynamicAuthReadExpression = (roles: Array<RoleDefinition>) => {
  const ownerExpression = new Array<ObjectNode>();
  const dynamicGroupExpression = new Array<ObjectNode>();
  const ownerRuleLoop = [
    iff(
      not(ref('isFieldAuthorized')),
      forEach(ref('ownerRole'), ref('dynamicRoles.owner'), [
        set(ref('ownerEntity'), ref('ownerRole.entity')),
        set(ref('ownerClaim'), ref('ownerRole.claim')),
        iff(
          methodCall(ref('util.isList'), ref('ownerEntity')),
          forEach(ref('allowedOwner'), ref('ownerEntity'), [
            iff(
              equals(ref('allowedOwner'), ref('ownerClaim')),
              compoundExpression([
                set(ref('isFieldAuthorized'), bool(true)),
                // break from inner loop
                str('#break'),
              ]),
            ),
          ]),
        ),
        iff(
          methodCall(ref('util.isString'), ref('ownerEntity')),
          iff(equals(ref('ownerEntity'), ref('ownerClaim')), set(ref('isFieldAuthorized'), bool(true))),
        ),
        iff(ref('isFieldAuthorized'), str('#break')),
      ]),
    ),
  ];
  const dynamicGroupLoop = [
    iff(
      not(ref('isFieldAuthorized')),
      forEach(ref('dynamicGroupRole'), ref('dynamicRoles.dynamicGroups'), [
        set(ref('dynamicGroupEntity'), ref('dynamicGroupRole.entity')),
        set(ref('dynamicGroupClaim'), ref('dynamicGroupRole.claim')),
        forEach(ref('userGroup'), ref('dynamicGroupClaim'), [
          iff(
            methodCall(ref('util.isList'), ref('dynamicGroupEntity')),
            iff(
              methodCall(ref('dynamicGroupEntity.contains'), ref('userGroup')),
              compoundExpression([
                set(ref('isFieldAuthorized'), bool(true)),
                // break from inner loop
                str('#break'),
              ]),
            ),
          ),
          iff(
            methodCall(ref('util.isString'), ref('dynamicGroupEntity')),
            iff(equals(ref('dynamicGroupEntity'), ref('userGroup')), set(ref('isFieldAuthorized'), bool(true))),
          ),
        ]),
        iff(ref('isFieldAuthorized'), str('#break')),
      ]),
    ),
  ];

  for (let role of roles) {
    if (role.strategy === 'owner') {
      ownerExpression.push(
        obj({
          entity: methodCall(ref('util.defaultIfNull'), ref(`ctx.source.${role.entity}`), list([])),
          claim: getOwnerExpression(role.claim!),
        }),
      );
    }
    if (role.strategy === 'groups') {
      dynamicGroupExpression.push(
        obj({
          entity: methodCall(ref('util.defaultIfNull'), ref(`ctx.source.${role.entity}`), list([])),
          claim: getIdentityClaimExp(str(role.claim!), list([])),
        }),
      );
    }
  }
  return compoundExpression([
    set(ref('dynamicRoles'), obj({ owner: list(ownerExpression), dynamicGroups: list(dynamicGroupExpression) })),
    ...(ownerExpression.length > 0 ? ownerRuleLoop : []),
    ...(dynamicGroupExpression.length > 0 ? dynamicGroupLoop : []),
  ]);
};

/**
 * if the apiKey and iam providers are not listed for those operations/field then they are denied
 * @param allowed can be used for query/field resolvers
 * @returns
 */
export const apiKeyReadExpression = (allowed: boolean = false): Expression => {
  return iff(equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)), set(ref('isStaticGroupAuthorized'), bool(allowed)));
};

export const jwtFieldAuthExpression = (
  provider: string,
  staticRoles: Array<RoleDefinition>,
  dynamicRoles: Array<RoleDefinition>,
): Expression | null => {
  const authExpressions = new Array<Expression>();
  if (staticRoles.length > 0) {
    authExpressions.push(...staticRuleExpression(staticRoles));
  }
  if (dynamicRoles.length > 0) {
    authExpressions.push(iff(not(ref('isFieldAuthorized')), generateDynamicAuthReadExpression(dynamicRoles)));
  }
  if (authExpressions.length > 0) {
    authExpressions.push(iff(not(ref('isFieldAuthorized')), ref('util.unauthorized()')));
    return iff(equals(ref('util.authType()'), str(provider)), compoundExpression(authExpressions));
  }
  return null;
};

export const generateAuthExpressionForField = (roles: Array<RoleDefinition>): string => {
  const { cognitoStaticGroupRoles, cognitoDynamicRoles, oidcStaticGroupRoles, oidcDynamicRoles, apiKeyRoles } = splitRoles(roles);
  const totalAuthExpressions = Array<Expression>();
  const canApiRead = apiKeyRoles.length > 0 ? true : false;
  totalAuthExpressions.push(apiKeyReadExpression(canApiRead));
  const cognitoAuthExpression = jwtFieldAuthExpression(COGNITO_AUTH_TYPE, cognitoStaticGroupRoles, cognitoDynamicRoles);
  const oidcAuthExpression = jwtFieldAuthExpression(OIDC_AUTH_TYPE, oidcStaticGroupRoles, oidcDynamicRoles);
  if (cognitoAuthExpression) totalAuthExpressions.push(cognitoAuthExpression);
  if (oidcAuthExpression) totalAuthExpressions.push(oidcAuthExpression);
  return printBlock('Field Authorization Steps')(compoundExpression([...totalAuthExpressions, toJson(obj({}))]));
};

/**
 * This is the response resolver for fields to protect subscriptions
 * @param subscriptionsEnabled
 * @returns
 */
export const generateFieldAuthResponse = (operation: string, fieldName: string, subscriptionsEnabled: boolean): string => {
  if (subscriptionsEnabled) {
    return printBlock('Checking for allowed operations which can return this field')(
      compoundExpression([
        set(ref('operation'), methodCall(ref('util.defaultIfNull'), ref('context.source.operation'), nul())),
        ifElse(equals(ref('operation'), str(operation)), toJson(nul()), toJson(ref(`context.source.${fieldName}`))),
      ]),
    );
  }
  return print(toJson(ref(`context.source.${fieldName}`)));
};
