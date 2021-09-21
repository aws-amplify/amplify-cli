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
  or,
} from 'graphql-mapping-template';
import {
  ADMIN_ROLE,
  API_KEY_AUTH_TYPE,
  COGNITO_AUTH_TYPE,
  ConfiguredAuthProviders,
  IAM_AUTH_TYPE,
  MANAGE_ROLE,
  OIDC_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
  fieldIsList,
  IS_AUTHORIZED_FLAG,
  ALLOWED_FIELDS,
  NULL_ALLOWED_FIELDS,
  DENIED_FIELDS,
} from '../utils';
import { getIdentityClaimExp, responseCheckForErrors, getOwnerClaim, getInputFields, setHasAuthExpression, iamCheck } from './helpers';

/**
 * There is only one role for ApiKey we can use the first index
 * @param roles
 * @returns Expression | null
 */
const apiKeyExpression = (roles: Array<RoleDefinition>) => {
  const expression = new Array<Expression>();
  if (roles.length === 0) {
    return iff(equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)), ref('util.unauthorized()'));
  }
  if (roles[0].allowedFields!.length > 0 || roles[0].nullAllowedFields!.length > 0) {
    expression.push(
      set(ref(`${ALLOWED_FIELDS}`), raw(JSON.stringify(roles[0].allowedFields))),
      set(ref(`${NULL_ALLOWED_FIELDS}`), raw(JSON.stringify(roles[0].nullAllowedFields))),
    );
  } else {
    expression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
  }
  return iff(equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)), compoundExpression(expression));
};

const iamExpression = (roles: Array<RoleDefinition>, hasAdminUIEnabled: boolean = false, adminUserPoolID?: string) => {
  const expression = new Array<Expression>();
  // allow if using admin ui
  if (hasAdminUIEnabled) {
    expression.push(
      iff(
        or([
          methodCall(ref('ctx.identity.userArn.contains'), str(`${adminUserPoolID}${ADMIN_ROLE}`)),
          methodCall(ref('ctx.identity.userArn.contains'), str(`${adminUserPoolID}${MANAGE_ROLE}`)),
        ]),
        raw('#return($util.toJson({})'),
      ),
    );
  }
  if (roles.length > 0) {
    for (let role of roles) {
      if (role.allowedFields!.length > 0 || role.nullAllowedFields!.length > 0) {
        expression.push(
          iamCheck(
            role.claim!,
            compoundExpression([
              set(ref(`${ALLOWED_FIELDS}`), raw(JSON.stringify(role.allowedFields))),
              set(ref(`${NULL_ALLOWED_FIELDS}`), raw(JSON.stringify(role.nullAllowedFields))),
            ]),
          ),
        );
      } else {
        iamCheck(role.claim!, set(ref(IS_AUTHORIZED_FLAG), bool(true)));
      }
    }
  } else {
    expression.push(ref('util.unauthorized()'));
  }
  return iff(equals(ref('util.authType()'), str(IAM_AUTH_TYPE)), compoundExpression(expression));
};

const generateStaticRoleExpression = (roles: Array<RoleDefinition>) => {
  const staticRoleExpression: Array<Expression> = new Array();
  const privateRoleIdx = roles.findIndex(r => r.strategy === 'private');
  if (privateRoleIdx > -1) {
    const privateRole = roles[privateRoleIdx];
    if (privateRole.allowedFields!.length > 0 || privateRole.nullAllowedFields!.length > 0) {
      staticRoleExpression.push(
        qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), raw(JSON.stringify(privateRole.allowedFields)))),
        qref(methodCall(ref(`${NULL_ALLOWED_FIELDS}.addAll`), raw(JSON.stringify(privateRole.nullAllowedFields)))),
      );
    } else {
      staticRoleExpression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
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
                })),
              ),
            ),
          ),
          forEach(/** for */ ref('groupRole'), /** in */ ref('staticGroupRoles'), [
            set(ref('groupsInToken'), getIdentityClaimExp(ref('groupRole.claim'), list([]))),
            iff(
              methodCall(ref('groupsInToken.contains'), ref('groupRole.entity')),
              compoundExpression([
                // if we find that it's not fully allowed on update (update/delete) we add the field conditions
                // otherwise we set to true and break
                ifElse(
                  or([not(ref(`groupRole.allowedFields.isEmpty()`)), not(ref('groupRole.nullAllowedFields.isEmpty()'))]),
                  compoundExpression([
                    qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), ref('groupRole.allowedFields'))),
                    qref(methodCall(ref(`${NULL_ALLOWED_FIELDS}.addAll`), ref('groupRole.nullAllowedFields'))),
                  ]),
                  compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw('#break')]),
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
            set(ref(`ownerClaim${idx}`), getOwnerClaim(role.claim!)),
            set(ref(`ownerAllowedFields${idx}`), raw(JSON.stringify(role.allowedFields))),
            set(ref(`ownerNullAllowedFields${idx}`), raw(JSON.stringify(role.nullAllowedFields))),
            ...(entityIsList
              ? [
                  forEach(ref('allowedOwner'), ref(`ownerEntity${idx}`), [
                    iff(
                      equals(ref('allowedOwner'), ref(`ownerClaim${idx}`)),
                      ifElse(
                        or([not(ref(`ownerAllowedFields${idx}.isEmpty()`)), not(ref(`ownerNullAllowedFields${idx}.isEmpty()`))]),
                        compoundExpression([
                          qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), ref(`ownerAllowedFields${idx}`))),
                          qref(methodCall(ref(`${NULL_ALLOWED_FIELDS}.addAll`), ref(`ownerNullAllowedFields${idx}`))),
                        ]),
                        compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw('#break')]),
                      ),
                    ),
                  ]),
                ]
              : [
                  iff(
                    equals(ref(`ownerEntity${idx}`), ref(`ownerClaim${idx}`)),
                    ifElse(
                      or([not(ref(`ownerAllowedFields${idx}.isEmpty()`)), not(ref(`ownerNullAllowedFields${idx}.isEmpty()`))]),
                      compoundExpression([
                        qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), ref(`ownerAllowedFields${idx}`))),
                        qref(methodCall(ref(`${NULL_ALLOWED_FIELDS}.addAll`), ref(`ownerNullAllowedFields${idx}`))),
                      ]),
                      compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true))]),
                    ),
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
            forEach(ref('userGroup'), ref(`groupClaim${idx}`), [
              iff(
                entityIsList
                  ? methodCall(ref(`groupEntity${idx}.contains`), ref('userGroup'))
                  : equals(ref(`groupEntity${idx}`), ref('userGroup')),
                ifElse(
                  or([not(ref(`groupAllowedFields${idx}.isEmpty()`)), not(ref(`groupNullAllowedFields${idx}.isEmpty()`))]),
                  compoundExpression([
                    qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), ref('groupRole.allowedFields'))),
                    qref(methodCall(ref(`${NULL_ALLOWED_FIELDS}.addAll`), ref('groupRole.nullAllowedFields'))),
                  ]),
                  compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw('#break')]),
                ),
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
 * @param providers
 * @param roles
 * @param fields
 * @returns
 */
export const generateAuthExpressionForUpdate = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
) => {
  const { cogntoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, apiKeyRoles, iamRoles } = splitRoles(roles);
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
  if (providers.hasIAM) {
    totalAuthExpressions.push(iamExpression(iamRoles, providers.hasAdminUIEnabled, providers.adminUserPoolID));
  }
  if (providers.hasUserPools) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(COGNITO_AUTH_TYPE)),
        compoundExpression([
          ...generateStaticRoleExpression(cogntoStaticRoles),
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
            and([methodCall(ref('util.isNull'), ref('entry.value')), not(ref(`${NULL_ALLOWED_FIELDS}.contains($entry.value)`))]),
            qref(methodCall(ref(`${DENIED_FIELDS}.put`), ref('entry.key'), str(''))),
          ),
        ]),
        forEach(ref('deniedField'), ref(`util.list.copyAndRemoveAll($inputFields, \$${ALLOWED_FIELDS})`), [
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
