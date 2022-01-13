import { FieldDefinitionNode } from 'graphql';
import {
  Expression,
  compoundExpression,
  set,
  ref,
  bool,
  raw,
  iff,
  and,
  not,
  methodCall,
  qref,
  list,
  nul,
  forEach,
  equals,
  str,
  printBlock,
  ifElse,
} from 'graphql-mapping-template';
import {
  getOwnerClaim,
  getIdentityClaimExp,
  getInputFields,
  addAllowedFieldsIfElse,
  emptyPayload,
  setHasAuthExpression,
  iamCheck,
  iamAdminRoleCheckExpression,
} from './helpers';
import {
  API_KEY_AUTH_TYPE,
  LAMBDA_AUTH_TYPE,
  COGNITO_AUTH_TYPE,
  ConfiguredAuthProviders,
  IAM_AUTH_TYPE,
  OIDC_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
  fieldIsList,
  IS_AUTHORIZED_FLAG,
  ALLOWED_FIELDS,
  DENIED_FIELDS,
} from '../utils';

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
  if (roles[0].allowedFields!.length > 0) {
    expression.push(set(ref(`${ALLOWED_FIELDS}`), raw(JSON.stringify(roles[0].allowedFields))));
  } else {
    expression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
  }
  return iff(equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)), compoundExpression(expression));
};

/**
 * No need to combine allowed fields as the request can only be signed by one iam role
 * @param roles
 * @returns
 */
const iamExpression = (
  roles: Array<RoleDefinition>,
  hasAdminRolesEnabled: boolean = false,
  adminRoles: Array<string> = [],
  identityPoolId?: string,
) => {
  const expression = new Array<Expression>();
  // allow if using an admin role
  if (hasAdminRolesEnabled) {
    expression.push(iamAdminRoleCheckExpression(adminRoles));
  }
  if (roles.length > 0) {
    for (let role of roles) {
      if (role.allowedFields!.length > 0) {
        expression.push(
          iamCheck(role.claim!, compoundExpression([set(ref(`${ALLOWED_FIELDS}`), raw(JSON.stringify(role.allowedFields)))])),
        );
      } else {
        expression.push(iamCheck(role.claim!, set(ref(IS_AUTHORIZED_FLAG), bool(true)), identityPoolId));
      }
    }
  } else {
    expression.push(ref('util.unauthorized()'));
  }
  return iff(equals(ref('util.authType()'), str(IAM_AUTH_TYPE)), compoundExpression(expression));
};

/**
 * There is only one role for Lambda we can use the first index
 * @param roles
 * @returns Expression | null
 */
const lambdaExpression = (roles: Array<RoleDefinition>) => {
  const expression = new Array<Expression>();
  if (roles.length === 0) {
    return iff(equals(ref('util.authType()'), str(LAMBDA_AUTH_TYPE)), ref('util.unauthorized()'));
  }
  if (roles[0].allowedFields!.length > 0) {
    expression.push(set(ref(`${ALLOWED_FIELDS}`), raw(JSON.stringify(roles[0].allowedFields))));
  } else {
    expression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
  }
  return iff(equals(ref('util.authType()'), str(LAMBDA_AUTH_TYPE)), compoundExpression(expression));
};

const generateStaticRoleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  const staticRoleExpression: Array<Expression> = new Array();
  const privateRoleIdx = roles.findIndex(r => r.strategy === 'private');
  if (privateRoleIdx > -1) {
    const privateRole = roles[privateRoleIdx];
    if (privateRole.allowedFields!.length > 0) {
      staticRoleExpression.push(qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), raw(JSON.stringify(privateRole.allowedFields)))));
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
            raw(JSON.stringify(roles.map(r => ({ claim: r.claim, entity: r.entity, allowedFields: r.allowedFields ?? [] })))),
          ),
          forEach(/** for */ ref('groupRole'), /** in */ ref('staticGroupRoles'), [
            set(ref('groupsInToken'), getIdentityClaimExp(ref('groupRole.claim'), list([]))),
            iff(
              methodCall(ref('groupsInToken.contains'), ref('groupRole.entity')),
              addAllowedFieldsIfElse('groupRole.allowedFields', true),
            ),
          ]),
        ]),
      ),
    );
  }
  return staticRoleExpression;
};

const dynamicRoleExpression = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>): Array<Expression> => {
  const ownerExpression = new Array<Expression>();
  const dynamicGroupExpression = new Array<Expression>();
  roles.forEach((role, idx) => {
    const entityIsList = fieldIsList(fields, role.entity!);
    if (role.strategy === 'owner') {
      ownerExpression.push(
        iff(
          not(ref(IS_AUTHORIZED_FLAG)),
          compoundExpression([
            set(ref(`ownerEntity${idx}`), methodCall(ref('util.defaultIfNull'), ref(`ctx.args.input.${role.entity!}`), nul())),
            set(ref(`ownerClaim${idx}`), getOwnerClaim(role.claim!)),
            set(ref(`ownerAllowedFields${idx}`), raw(JSON.stringify(role.allowedFields))),
            ...(entityIsList
              ? [
                  forEach(ref('allowedOwner'), ref(`ownerEntity${idx}`), [
                    iff(equals(ref('allowedOwner'), ref(`ownerClaim${idx}`)), addAllowedFieldsIfElse(`ownerAllowedFields${idx}`, true)),
                  ]),
                ]
              : [iff(equals(ref(`ownerClaim${idx}`), ref(`ownerEntity${idx}`)), addAllowedFieldsIfElse(`ownerAllowedFields${idx}`))]),
            iff(
              and([ref(`util.isNull($ownerEntity${idx})`), not(methodCall(ref('ctx.args.input.containsKey'), str(role.entity!)))]),
              compoundExpression([
                qref(
                  methodCall(
                    ref('ctx.args.input.put'),
                    str(role.entity!),
                    entityIsList ? list([ref(`ownerClaim${idx}`)]) : ref(`ownerClaim${idx}`),
                  ),
                ),
                addAllowedFieldsIfElse(`ownerAllowedFields${idx}`),
              ]),
            ),
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
              methodCall(ref('util.defaultIfNull'), ref(`ctx.args.input.${role.entity!}`), entityIsList ? list([]) : nul()),
            ),
            set(ref(`groupClaim${idx}`), getIdentityClaimExp(str(role.claim!), list([]))),
            iff(
              methodCall(ref(`util.isString`), ref(`groupClaim${idx}`)),
              ifElse(
                methodCall(ref(`util.isList`), methodCall(ref(`util.parseJson`), ref(`groupClaim${idx}`))),
                set(ref(`groupClaim${idx}`), methodCall(ref(`util.parseJson`), ref(`groupClaim${idx}`))),
                set(ref(`groupClaim${idx}`), list([ref(`groupClaim${idx}`)])),
              ),
            ),
            set(ref(`groupAllowedFields${idx}`), raw(JSON.stringify(role.allowedFields))),
            forEach(ref('userGroup'), ref(`groupClaim${idx}`), [
              iff(
                entityIsList
                  ? methodCall(ref(`groupEntity${idx}.contains`), ref('userGroup'))
                  : equals(ref(`groupEntity${idx}`), ref('userGroup')),
                addAllowedFieldsIfElse(`groupAllowedFields${idx}`, true),
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
 * Unauthorized if
 * - auth conditions could not be met
 * - there are fields conditions that could not be met
 * @param providers
 * @param roles
 * @param fields
 * @returns
 */
export const generateAuthExpressionForCreate = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
): string => {
  const { cognitoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, apiKeyRoles, iamRoles, lambdaRoles } =
    splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [
    setHasAuthExpression,
    getInputFields(),
    set(ref(IS_AUTHORIZED_FLAG), bool(false)),
    set(ref(ALLOWED_FIELDS), list([])),
  ];
  if (providers.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (providers.hasIAM) {
    totalAuthExpressions.push(iamExpression(iamRoles, providers.hasAdminRolesEnabled, providers.adminRoles, providers.identityPoolId));
  }
  if (providers.hasLambda) {
    totalAuthExpressions.push(lambdaExpression(lambdaRoles));
  }
  if (providers.hasUserPools) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(COGNITO_AUTH_TYPE)),
        compoundExpression([...generateStaticRoleExpression(cognitoStaticRoles), ...dynamicRoleExpression(cognitoDynamicRoles, fields)]),
      ),
    );
  }
  if (providers.hasOIDC) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([...generateStaticRoleExpression(oidcStaticRoles), ...dynamicRoleExpression(oidcDynamicRoles, fields)]),
      ),
    );
  }
  totalAuthExpressions.push(
    iff(and([not(ref(IS_AUTHORIZED_FLAG)), ref(`${ALLOWED_FIELDS}.isEmpty()`)]), ref('util.unauthorized()')),
    iff(
      not(ref(IS_AUTHORIZED_FLAG)),
      compoundExpression([
        set(ref(DENIED_FIELDS), methodCall(ref('util.list.copyAndRemoveAll'), ref('inputFields'), ref(ALLOWED_FIELDS))),
        iff(
          ref(`${DENIED_FIELDS}.size() > 0`),
          methodCall(ref('util.error'), str(`Unauthorized on \${${DENIED_FIELDS}}`), str('Unauthorized')),
        ),
      ]),
    ),
  );
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, emptyPayload]));
};
