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
  nul,
  printBlock,
  or,
} from 'graphql-mapping-template';
import {
  COGNITO_AUTH_TYPE,
  ConfiguredAuthProviders,
  IS_AUTHORIZED_FLAG,
  OIDC_AUTH_TYPE,
  RoleDefinition,
  splitRoles,
} from '../utils';
import {
  generateStaticRoleExpression,
  apiKeyExpression,
  iamExpression,
  lambdaExpression,
  emptyPayload,
  setHasAuthExpression,
  generateOwnerClaimExpression,
  generateOwnerClaimListExpression,
} from './helpers';

const dynamicRoleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  const ownerExpression = new Array<Expression>();
  // we only check against owner rules which are not list fields
  roles.forEach((role, idx) => {
    if (role.strategy === 'owner') {
      ownerExpression.push(
        generateOwnerClaimExpression(role.claim!, `ownerClaim${idx}`),
        generateOwnerClaimListExpression(role.claim!, `ownerClaimsList${idx}`),
        set(
          ref(`ownerEntity${idx}`),
          methodCall(ref('util.defaultIfNull'), ref(`ctx.args.${role.entity!}`), nul()),
        ),
        iff(
          not(ref(IS_AUTHORIZED_FLAG)),
          compoundExpression([
            iff(
              or([
                equals(ref(`ownerEntity${idx}`), ref(`ownerClaim${idx}`)),
                methodCall(ref(`ownerClaimsList${idx}.contains`), ref(`ownerEntity${idx}`)),
              ]),
              set(ref(IS_AUTHORIZED_FLAG), bool(true))),
          ]),
        ),
      );
    }
  });

  return [...(ownerExpression.length > 0 ? ownerExpression : [])];
};

/**
 * Generates auth expressions for each auth type for Subscription requests
 */
export const generateAuthExpressionForSubscriptions = (providers: ConfiguredAuthProviders, roles: Array<RoleDefinition>): string => {
  const {
    cognitoStaticRoles, cognitoDynamicRoles, oidcStaticRoles, oidcDynamicRoles, iamRoles, apiKeyRoles, lambdaRoles,
  } = splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [setHasAuthExpression, set(ref(IS_AUTHORIZED_FLAG), bool(false))];
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
        compoundExpression([...generateStaticRoleExpression(cognitoStaticRoles), ...dynamicRoleExpression(cognitoDynamicRoles)]),
      ),
    );
  }
  if (providers.hasOIDC) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([...generateStaticRoleExpression(oidcStaticRoles), ...dynamicRoleExpression(oidcDynamicRoles)]),
      ),
    );
  }
  totalAuthExpressions.push(iff(not(ref(IS_AUTHORIZED_FLAG)), ref('util.unauthorized()')));
  return printBlock('Authorization Steps')(compoundExpression([...totalAuthExpressions, emptyPayload]));
};
