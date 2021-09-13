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
  printBlock,
} from 'graphql-mapping-template';
import { COGNITO_AUTH_TYPE, ConfiguredAuthProviders, IS_AUTHORIZED_FLAG, OIDC_AUTH_TYPE, RoleDefinition, splitRoles } from '../utils';
import { generateStaticRoleExpression, getOwnerClaim, apiKeyExpression, iamExpression, emptyPayload } from './helpers';

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
            iff(equals(ref(`ownerEntity${idx}`), ref(`ownerClaim${idx}`)), set(ref(IS_AUTHORIZED_FLAG), bool(true))),
          ]),
        ),
      );
    }
  });

  return [...(ownerExpression.length > 0 ? ownerExpression : [])];
};

export const generateAuthExpressionForSubscriptions = (providers: ConfiguredAuthProviders, roles: Array<RoleDefinition>): string => {
  const { cogntoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, iamRoles, apiKeyRoles } = splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [set(ref(IS_AUTHORIZED_FLAG), bool(false)), set(ref('allowedFields'), list([]))];
  if (providers.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (providers.hasIAM) {
    totalAuthExpressions.push(iamExpression(iamRoles, providers.hasAdminUIEnabled, providers.adminUserPoolID));
  }
  if (providers.hasUserPools)
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(COGNITO_AUTH_TYPE)),
        compoundExpression([...generateStaticRoleExpression(cogntoStaticRoles), ...dynamicRoleExpression(cognitoDynamicRoles)]),
      ),
    );
  if (providers.hasOIDC)
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([...generateStaticRoleExpression(oidcStaticRoles), ...dynamicRoleExpression(oidcDynamicRoles)]),
      ),
    );
  totalAuthExpressions.push(iff(not(ref(IS_AUTHORIZED_FLAG)), ref('util.unauthorized()')));
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, emptyPayload]));
};
