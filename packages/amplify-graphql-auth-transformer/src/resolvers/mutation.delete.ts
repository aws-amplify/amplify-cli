import { FieldDefinitionNode } from 'graphql';
import {
  Expression,
  printBlock,
  compoundExpression,
  bool,
  equals,
  iff,
  raw,
  ref,
  set,
  str,
  methodCall,
  or,
  forEach,
  list,
  not,
  nul,
} from 'graphql-mapping-template';
import { emptyPayload, getIdentityClaimExp, getOwnerClaim, iamCheck, setHasAuthExpression } from './helpers';
import {
  ADMIN_ROLE,
  API_KEY_AUTH_TYPE,
  COGNITO_AUTH_TYPE,
  ConfiguredAuthProviders,
  fieldIsList,
  IAM_AUTH_TYPE,
  IS_AUTHORIZED_FLAG,
  MANAGE_ROLE,
  OIDC_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
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
  if (roles.length > 0) {
    expression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
  }
  return iff(equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)), compoundExpression(expression));
};
/**
 * No need to combine allowed fields as the request can only be signed by one iam role
 * @param roles
 * @returns
 */
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
      iamCheck(role.claim!, set(ref(IS_AUTHORIZED_FLAG), bool(true)));
    }
  } else {
    expression.push(ref('util.unauthorized()'));
  }
  return iff(equals(ref('util.authType()'), str(IAM_AUTH_TYPE)), compoundExpression(expression));
};

const generateStaticRoleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  const staticRoleExpression: Array<Expression> = new Array();
  const privateRoleIdx = roles.findIndex(r => r.strategy === 'private');
  if (privateRoleIdx > -1) {
    staticRoleExpression.push(set(ref(IS_AUTHORIZED_FLAG), bool(true)));
    roles.splice(privateRoleIdx, -1);
  }
  if (roles.length > 0) {
    staticRoleExpression.push(
      iff(
        not(ref(IS_AUTHORIZED_FLAG)),
        compoundExpression([
          set(ref('staticGroupRoles'), raw(JSON.stringify(roles.map(r => ({ claim: r.claim, entity: r.entity }))))),
          forEach(/** for */ ref('groupRole'), /** in */ ref('staticGroupRoles'), [
            set(ref('groupsInToken'), getIdentityClaimExp(ref('groupRole.claim'), list([]))),
            iff(
              methodCall(ref('groupsInToken.contains'), ref('groupRole.entity')),
              compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw('#break')]),
            ),
          ]),
        ]),
      ),
    );
  }
  return staticRoleExpression;
};

const dynamicGroupRoleExpression = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>) => {
  const ownerExpression = new Array<Expression>();
  const dynamicGroupExpression = new Array<Expression>();
  roles.forEach((role, idx) => {
    const entityIsList = fieldIsList(fields, role.entity!);
    if (role.strategy === 'owner') {
      ownerExpression.push(
        iff(
          not(ref(IS_AUTHORIZED_FLAG)),
          compoundExpression([
            set(ref(`ownerEntity${idx}`), methodCall(ref('util.defaultIfNull'), ref(`ctx.result.${role.entity!}`), nul())),
            set(ref(`ownerClaim${idx}`), getOwnerClaim(role.claim!)),
            ...(entityIsList
              ? [
                  forEach(ref('allowedOwner'), ref(`ownerEntity${idx}`), [
                    iff(equals(ref('allowedOwner'), ref(`ownerClaim${idx}`)), set(ref(IS_AUTHORIZED_FLAG), bool(true))),
                  ]),
                ]
              : [iff(equals(ref(`ownerEntity${idx}`), ref(`ownerClaim${idx}`)), set(ref(IS_AUTHORIZED_FLAG), bool(true)))]),
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
            forEach(ref('userGroup'), ref(`groupClaim${idx}`), [
              iff(
                entityIsList
                  ? methodCall(ref(`groupEntity${idx}.contains`), ref('userGroup'))
                  : equals(ref(`groupEntity${idx}`), ref('userGroup')),
                set(ref(IS_AUTHORIZED_FLAG), bool(true)),
              ),
            ]),
          ]),
        ),
      );
    }
  });
  return [...(ownerExpression.length > 0 ? ownerExpression : []), ...(dynamicGroupExpression.length > 0 ? dynamicGroupExpression : [])];
};

export const geneateAuthExpressionForDelete = (
  providers: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
) => {
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
  totalAuthExpressions.push(iff(not(ref(IS_AUTHORIZED_FLAG)), ref('util.unauthorized()')));
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, emptyPayload]));
};
