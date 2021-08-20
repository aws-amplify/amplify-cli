import { OPERATION_KEY } from '@aws-amplify/graphql-model-transformer';
import { FieldDefinitionNode } from 'graphql';
import {
  Expression,
  iff,
  not,
  ref,
  equals,
  str,
  compoundExpression,
  printBlock,
  toJson,
  obj,
  set,
  methodCall,
  nul,
  ifElse,
  bool,
  raw,
  forEach,
} from 'graphql-mapping-template';
import {
  RoleDefinition,
  splitRoles,
  COGNITO_AUTH_TYPE,
  OIDC_AUTH_TYPE,
  ConfiguredAuthProviders,
  fieldIsList,
  IS_AUTHORIZED_FLAG,
} from '../utils';
import { getOwnerClaim, staticGroupRoleExpression, apiKeyExpression, iamExpression } from './helpers';

// Field Read VTL Functions
const generateDynamicAuthReadExpression = (roles: Array<RoleDefinition>, fields: ReadonlyArray<FieldDefinitionNode>) => {
  const ownerExpressions = new Array<Expression>();
  const dynamicGroupExpressions = new Array<Expression>();
  roles.forEach((role, idx) => {
    const entityIsList = fieldIsList(fields, role.entity!);
    if (role.strategy === 'owner') {
      ownerExpressions.push(
        iff(
          not(ref(IS_AUTHORIZED_FLAG)),
          compoundExpression([
            set(ref(`ownerEntity${idx}`), methodCall(ref('util.defaultIfNull'), ref(`ctx.source.${role.entity!}`), nul())),
            set(ref(`ownerClaim${idx}`), getOwnerClaim(role.claim!)),
            ...(entityIsList
              ? [
                  forEach(ref('allowedOwner'), ref(`ownerEntity${idx}`), [
                    iff(
                      equals(ref('allowedOwner'), ref(`ownerClaim${idx}`)),
                      compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw('#break')]),
                    ),
                  ]),
                ]
              : [iff(equals(ref('ownerEntity'), ref(`ownerClaim${idx}`)), set(ref(IS_AUTHORIZED_FLAG), bool(true)))]),
          ]),
        ),
      );
    }
    if (role.strategy === 'groups') {
      dynamicGroupExpressions.push(
        iff(
          not(ref(IS_AUTHORIZED_FLAG)),
          compoundExpression([
            set(ref(`groupEntity${idx}`), methodCall(ref('util.defaultIfNull'), ref(`ctx.source.${role.entity!}`), nul())),
            set(ref(`groupClaim${idx}`), getOwnerClaim(role.claim!)),
            forEach(ref('userGroup'), ref('dynamicGroupClaim'), [
              iff(
                entityIsList
                  ? methodCall(ref(`groupEntity${idx}.contains`), ref('userGroup'))
                  : equals(ref(`groupEntity${idx}`), ref('userGroup')),
                compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw('#break')]),
              ),
            ]),
          ]),
        ),
      );
    }
  });
  return [...(ownerExpressions.length > 0 ? ownerExpressions : []), ...(dynamicGroupExpressions.length > 0 ? dynamicGroupExpressions : [])];
};

export const generateAuthExpressionForField = (
  provider: ConfiguredAuthProviders,
  roles: Array<RoleDefinition>,
  fields: ReadonlyArray<FieldDefinitionNode>,
): string => {
  const { cognitoStaticGroupRoles, cognitoDynamicRoles, oidcStaticGroupRoles, oidcDynamicRoles, iamRoles, apiKeyRoles } = splitRoles(roles);
  const totalAuthExpressions: Array<Expression> = [set(ref(IS_AUTHORIZED_FLAG), bool(false))];
  if (provider.hasApiKey) {
    totalAuthExpressions.push(apiKeyExpression(apiKeyRoles));
  }
  if (provider.hasIAM) {
    totalAuthExpressions.push(iamExpression(iamRoles, provider.hasAdminUIEnabled));
  }
  if (provider.hasUserPools) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(COGNITO_AUTH_TYPE)),
        compoundExpression([
          ...staticGroupRoleExpression(cognitoStaticGroupRoles),
          ...generateDynamicAuthReadExpression(cognitoDynamicRoles, fields),
        ]),
      ),
    );
  }
  if (provider.hasOIDC) {
    totalAuthExpressions.push(
      iff(
        equals(ref('util.authType()'), str(OIDC_AUTH_TYPE)),
        compoundExpression([
          ...staticGroupRoleExpression(oidcStaticGroupRoles),
          ...generateDynamicAuthReadExpression(oidcDynamicRoles, fields),
        ]),
      ),
    );
  }
  totalAuthExpressions.push(iff(not(ref(IS_AUTHORIZED_FLAG)), ref('util.unauthorized()')));
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
        set(ref('operation'), methodCall(ref('util.defaultIfNull'), methodCall(ref('ctx.source.get'), str(OPERATION_KEY)), nul())),
        ifElse(equals(ref('operation'), str(operation)), toJson(nul()), toJson(ref(`context.source.${fieldName}`))),
      ]),
    );
  }
  return printBlock('Return Source Field')(toJson(ref(`context.source.${fieldName}`)));
};
