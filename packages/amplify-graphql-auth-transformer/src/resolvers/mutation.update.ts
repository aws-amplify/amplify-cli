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
  obj,
  list,
  qref,
  equals,
  str,
  and,
  methodCall,
  toJson,
  printBlock,
  ifElse,
  nul,
} from 'graphql-mapping-template';
import {
  API_KEY_AUTH_TYPE,
  COGNITO_AUTH_TYPE,
  LAMBDA_AUTH_TYPE,
  ConfiguredAuthProviders,
  IAM_AUTH_TYPE,
  OIDC_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
  fieldIsList,
  IS_AUTHORIZED_FLAG,
  ALLOWED_FIELDS,
  NULL_ALLOWED_FIELDS,
  DENIED_FIELDS,
} from '../utils';
import {
  getIdentityClaimExp,
  responseCheckForErrors,
  getInputFields,
  setHasAuthExpression,
  iamCheck,
  iamAdminRoleCheckExpression,
  generateOwnerClaimExpression,
} from './helpers';

/**
 * There is only one role for ApiKey we can use the first index
 */
const apiKeyExpression = (roles: Array<RoleDefinition>): Expression | null => {
  const expression = new Array<Expression>();
  if (roles.length === 0) {
    return iff(equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)), ref('util.unauthorized()'));
  }

  if (roles[0].areAllFieldsAllowed && roles[0].areAllFieldsNullAllowed) {
    expression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
  } else {
    expression.push(
      set(ref(`${ALLOWED_FIELDS}`), raw(JSON.stringify(roles[0].allowedFields))),
      set(ref(`${NULL_ALLOWED_FIELDS}`), raw(JSON.stringify(roles[0].nullAllowedFields))),
    );
  }
  return iff(equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)), compoundExpression(expression));
};

/**
 * There is only one role for Lambda we can use the first index
 */
const lambdaExpression = (roles: Array<RoleDefinition>): Expression | null => {
  const expression = new Array<Expression>();
  if (roles.length === 0) {
    return iff(equals(ref('util.authType()'), str(LAMBDA_AUTH_TYPE)), ref('util.unauthorized()'));
  }
  if (roles[0].areAllFieldsAllowed && roles[0].areAllFieldsNullAllowed) {
    expression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
  } else {
    expression.push(
      set(ref(`${ALLOWED_FIELDS}`), raw(JSON.stringify(roles[0].allowedFields))),
      set(ref(`${NULL_ALLOWED_FIELDS}`), raw(JSON.stringify(roles[0].nullAllowedFields))),
    );
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
  if (roles.length > 0) {
    roles.forEach(role => {
      if (role.areAllFieldsAllowed && role.areAllFieldsNullAllowed) {
        expression.push(iamCheck(role.claim!, set(ref(IS_AUTHORIZED_FLAG), bool(true)), identityPoolId));
      } else {
        expression.push(
          iamCheck(
            role.claim!,
            compoundExpression([
              set(ref(`${ALLOWED_FIELDS}`), raw(JSON.stringify(role.allowedFields))),
              set(ref(`${NULL_ALLOWED_FIELDS}`), raw(JSON.stringify(role.nullAllowedFields))),
            ]),
            identityPoolId,
          ),
        );
      }
    });
  } else {
    expression.push(ref('util.unauthorized()'));
  }
  return iff(equals(ref('util.authType()'), str(IAM_AUTH_TYPE)), compoundExpression(expression));
};

const generateStaticRoleExpression = (roles: Array<RoleDefinition>): Expression[] => {
  const staticRoleExpression: Array<Expression> = [];
  const privateRoleIdx = roles.findIndex(r => r.strategy === 'private');
  if (privateRoleIdx > -1) {
    const privateRole = roles[privateRoleIdx];
    if (privateRole.areAllFieldsAllowed && privateRole.areAllFieldsNullAllowed) {
      staticRoleExpression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
    } else {
      staticRoleExpression.push(
        qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), raw(JSON.stringify(privateRole.allowedFields)))),
        qref(methodCall(ref(`${NULL_ALLOWED_FIELDS}.addAll`), raw(JSON.stringify(privateRole.nullAllowedFields)))),
      );
    }
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
                roles.map(r => ({
                  claim: r.claim,
                  entity: r.entity,
                  allowedFields: r.allowedFields,
                  nullAllowedFields: r.nullAllowedFields,
                  isAuthorizedOnAllFields: r.areAllFieldsAllowed && r.areAllFieldsNullAllowed,
                })),
              ),
            ),
          ),
          forEach(/** for */ ref('groupRole'), /** in */ ref('staticGroupRoles'), [
            set(ref('groupsInToken'), getIdentityClaimExp(ref('groupRole.claim'), list([]))),
            iff(
              methodCall(ref('groupsInToken.contains'), ref('groupRole.entity')),
              addAllowedFieldsIfElse('groupRole.allowedFields', 'groupRole.nullAllowedFields', 'groupRole.isAuthorizedOnAllFields', true),
            ),
          ]),
        ]),
      ),
    );
  }
  return staticRoleExpression;
};
const dynamicGroupRoleExpression = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>): Array<Expression> => {
  const ownerExpression = new Array<Expression>();
  const dynamicGroupExpression = new Array<Expression>();
  roles.forEach((role, idx) => {
    const entityIsList = fieldIsList(fields, role.entity!);
    if (role.strategy === 'owner') {
      ownerExpression.push(
        iff(
          not(ref(IS_AUTHORIZED_FLAG)),
          compoundExpression([
            set(
              ref(`ownerEntity${idx}`),
              methodCall(ref('util.defaultIfNull'), ref(`ctx.result.${role.entity!}`), entityIsList ? list([]) : nul()),
            ),
            generateOwnerClaimExpression(role.claim!, idx),
            set(ref(`ownerAllowedFields${idx}`), raw(JSON.stringify(role.allowedFields))),
            set(ref(`ownerNullAllowedFields${idx}`), raw(JSON.stringify(role.nullAllowedFields))),
            set(ref(`isAuthorizedOnAllFields${idx}`), bool(role.areAllFieldsAllowed && role.areAllFieldsNullAllowed)),
            ...(entityIsList
              ? [
                forEach(ref('allowedOwner'), ref(`ownerEntity${idx}`), [
                  iff(
                    equals(ref('allowedOwner'), ref(`ownerClaim${idx}`)),
                    addAllowedFieldsIfElse(
                      `ownerAllowedFields${idx}`,
                      `ownerNullAllowedFields${idx}`,
                      `isAuthorizedOnAllFields${idx}`,
                      true,
                    ),
                  ),
                ]),
              ]
              : [
                iff(
                  equals(ref(`ownerEntity${idx}`), ref(`ownerClaim${idx}`)),
                  addAllowedFieldsIfElse(`ownerAllowedFields${idx}`, `ownerNullAllowedFields${idx}`, `isAuthorizedOnAllFields${idx}`),
                ),
              ]),
          ]),
        ),
      );
    }
    if (role.strategy === 'groups') {
      dynamicGroupExpression.push(
        iff(
          not(ref(IS_AUTHORIZED_FLAG)),
          compoundExpression([
            set(
              ref(`groupEntity${idx}`),
              methodCall(ref('util.defaultIfNull'), ref(`ctx.result.${role.entity}`), entityIsList ? list([]) : nul()),
            ),
            set(ref(`groupClaim${idx}`), getIdentityClaimExp(str(role.claim!), list([]))),
            set(ref(`groupAllowedFields${idx}`), raw(JSON.stringify(role.allowedFields))),
            set(ref(`groupNullAllowedFields${idx}`), raw(JSON.stringify(role.nullAllowedFields))),
            set(ref(`isAuthorizedOnAllFields${idx}`), bool(role.areAllFieldsAllowed && role.areAllFieldsNullAllowed)),
            iff(
              methodCall(ref('util.isString'), ref(`groupClaim${idx}`)),
              ifElse(
                methodCall(ref('util.isList'), methodCall(ref('util.parseJson'), ref(`groupClaim${idx}`))),
                set(ref(`groupClaim${idx}`), methodCall(ref('util.parseJson'), ref(`groupClaim${idx}`))),
                set(ref(`groupClaim${idx}`), list([ref(`groupClaim${idx}`)])),
              ),
            ),
            forEach(ref('userGroup'), ref(`groupClaim${idx}`), [
              iff(
                entityIsList
                  ? methodCall(ref(`groupEntity${idx}.contains`), ref('userGroup'))
                  : equals(ref(`groupEntity${idx}`), ref('userGroup')),

                addAllowedFieldsIfElse(`groupAllowedFields${idx}`, `groupNullAllowedFields${idx}`, `isAuthorizedOnAllFields${idx}`, true),
              ),
            ]),
          ]),
        ),
      );
    }
  });
  return [...(ownerExpression.length > 0 ? ownerExpression : []), ...(dynamicGroupExpression.length > 0 ? dynamicGroupExpression : [])];
};

/**
 * For update we need to check for allowed fields and null allowed fields
 * unauthorized if
 *  - none of the roles have been met and there are no field conditions
 *  - role is partially allowed but the field conditions have not been met
 */
export const generateAuthExpressionForUpdate = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
): string => {
  const {
    cognitoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, apiKeyRoles, iamRoles, lambdaRoles,
  } = splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [
    setHasAuthExpression,
    responseCheckForErrors(),
    getInputFields(),
    set(ref(IS_AUTHORIZED_FLAG), bool(false)),
    set(ref(`${ALLOWED_FIELDS}`), list([])),
    set(ref(`${NULL_ALLOWED_FIELDS}`), list([])),
    set(ref(`${DENIED_FIELDS}`), obj({})),
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
          ...dynamicGroupRoleExpression(cognitoDynamicRoles, fields),
        ]),
      ),
    );
  }
  if (providers.hasOIDC) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([...generateStaticRoleExpression(oidcStaticRoles), ...dynamicGroupRoleExpression(oidcDynamicRoles, fields)]),
      ),
    );
  }
  totalAuthExpressions.push(
    iff(
      and([not(ref(IS_AUTHORIZED_FLAG)), ref(`${ALLOWED_FIELDS}.isEmpty()`), ref(`${NULL_ALLOWED_FIELDS}.isEmpty()`)]),
      ref('util.unauthorized()'),
    ),
    // if not authorized we check the field conditions
    iff(
      not(ref(IS_AUTHORIZED_FLAG)),
      compoundExpression([
        forEach(ref('entry'), ref('util.map.copyAndRetainAllKeys($ctx.args.input, $inputFields).entrySet()'), [
          iff(
            and([methodCall(ref('util.isNull'), ref('entry.value')), not(ref(`${NULL_ALLOWED_FIELDS}.contains($entry.key)`))]),
            qref(methodCall(ref(`${DENIED_FIELDS}.put`), ref('entry.key'), str(''))),
          ),
        ]),
        forEach(ref('deniedField'), ref(`util.list.copyAndRemoveAll($inputFields, $${ALLOWED_FIELDS})`), [
          qref(methodCall(ref(`${DENIED_FIELDS}.put`), ref('deniedField'), str(''))),
        ]),
      ]),
    ),
    iff(
      ref(`${DENIED_FIELDS}.keySet().size() > 0`),
      methodCall(ref('util.error'), str(`Unauthorized on \${${DENIED_FIELDS}.keySet()}`), str('Unauthorized')),
    ),
  );
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, toJson(obj({}))]));
};

const addAllowedFieldsIfElse = (
  allowedFieldsKey: string,
  nullAllowedFieldsKey: string,
  condition: string,
  breakLoop = false,
): Expression => ifElse(
  ref(condition),
  compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), ...(breakLoop ? [raw('#break')] : [])]),
  compoundExpression([
    qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), ref(allowedFieldsKey))),
    qref(methodCall(ref(`${NULL_ALLOWED_FIELDS}.addAll`), ref(nullAllowedFieldsKey))),
  ]),
);
