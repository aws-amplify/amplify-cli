import {
  bool,
  compoundExpression,
  equals,
  Expression,
  iff,
  methodCall,
  not,
  ref,
  set,
  str,
  list,
  nul,
  toJson,
  obj,
  printBlock,
} from 'graphql-mapping-template';
import { COGNITO_AUTH_TYPE, ConfiguredAuthProviders, IS_AUTHORIZED_FLAG, OIDC_AUTH_TYPE, RoleDefinition, splitRoles } from '../utils';
import { staticGroupRoleExpression, getInputFields, getOwnerClaim, apiKeyExpression, iamExpression } from './helpers';

const dynamicRoleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  const ownerExpression = new Array<Expression>();
  // we only check against owner rules which are not list fields
  roles.forEach((role, idx) => {
    if (role.strategy === 'owner') {
      ownerExpression.push(
        iff(
          not(ref(IS_AUTHORIZED_FLAG)),
          compoundExpression([
            set(ref(`ownerEntity${idx}`), methodCall(ref('util.defaultIfNull'), ref(`ctx.args.${role.entity!}`), nul())),
            set(ref(`ownerClaim${idx}`), getOwnerClaim(role.claim!)),
            iff(equals(ref(`ownerClaim${idx}`), ref(`ownerClaim${idx}`)), set(ref(IS_AUTHORIZED_FLAG), bool(true))),
          ]),
        ),
      );
    }
  });

  return [...(ownerExpression.length > 0 ? ownerExpression : [])];
};

export const generateAuthExpressionForSubscriptions = (providers: ConfiguredAuthProviders, roles: Array<RoleDefinition>): string => {
  const { cognitoStaticGroupRoles, cognitoDynamicRoles, oidcStaticGroupRoles, oidcDynamicRoles, iamRoles, apiKeyRoles } = splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [
    getInputFields(),
    set(ref(IS_AUTHORIZED_FLAG), bool(false)),
    set(ref('allowedFields'), list([])),
  ];
  if (providers.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (providers.hasIAM) {
    totalAuthExpressions.push(iamExpression(iamRoles, providers.hasAdminUIEnabled));
  }
  if (providers.hasUserPools)
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(COGNITO_AUTH_TYPE)),
        compoundExpression([...staticGroupRoleExpression(cognitoStaticGroupRoles), ...dynamicRoleExpression(cognitoDynamicRoles)]),
      ),
    );
  if (providers.hasOIDC)
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([...staticGroupRoleExpression(oidcStaticGroupRoles), ...dynamicRoleExpression(oidcDynamicRoles)]),
      ),
    );
  totalAuthExpressions.push(iff(not(ref(IS_AUTHORIZED_FLAG)), ref('util.unauthorized()')));
  return printBlock('Create Authorization Steps')(compoundExpression([...totalAuthExpressions, toJson(obj({}))]));
};
