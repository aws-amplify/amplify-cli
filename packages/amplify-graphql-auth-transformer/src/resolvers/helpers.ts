import {
  qref,
  Expression,
  ifElse,
  iff,
  methodCall,
  not,
  ref,
  set,
  str,
  raw,
  obj,
  bool,
  compoundExpression,
  printBlock,
  toJson,
  forEach,
  list,
  equals,
  or,
  and,
  parens,
  notEquals,
  CompoundExpressionNode,
} from 'graphql-mapping-template';
import { NONE_VALUE } from 'graphql-transformer-common';
import {
  DEFAULT_COGNITO_IDENTITY_CLAIM,
  RoleDefinition,
  IS_AUTHORIZED_FLAG,
  API_KEY_AUTH_TYPE,
  LAMBDA_AUTH_TYPE,
  IAM_AUTH_TYPE,
} from '../utils';

// note in the resolver that operation is protected by auth
export const setHasAuthExpression: Expression = qref(methodCall(ref('ctx.stash.put'), str('hasAuth'), bool(true)));

// since the keySet returns a set we can convert it to a list by converting to json and parsing back as a list
/**
 * Creates get input fields helper
 */
export const getInputFields = (): Expression => set(ref('inputFields'), methodCall(ref('util.parseJson'), methodCall(ref('util.toJson'), ref('ctx.args.input.keySet()'))));

/**
 * Creates get identity claim helper
 */
export const getIdentityClaimExp = (value: Expression, defaultValueExp: Expression): Expression => methodCall(ref('util.defaultIfNull'), methodCall(ref('ctx.identity.claims.get'), value), defaultValueExp);

/**
 * Creates iam check helper
 */
export const iamCheck = (claim: string, exp: Expression, identityPoolId?: string): Expression => {
  let iamExp: Expression = equals(ref('ctx.identity.userArn'), ref(`ctx.stash.${claim}`));
  // only include the additional check if we have a private rule and a provided identityPoolId
  if (identityPoolId && claim === 'authRole') {
    iamExp = or([
      parens(iamExp),
      parens(
        and([
          equals(ref('ctx.identity.cognitoIdentityPoolId'), str(identityPoolId)),
          equals(ref('ctx.identity.cognitoIdentityAuthType'), str('authenticated')),
        ]),
      ),
    ]);
  }
  return iff(iamExp, exp);
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
export const getOwnerClaim = (ownerClaim: string): Expression => {
  if (ownerClaim === 'username') {
    return getIdentityClaimExp(str(ownerClaim), getIdentityClaimExp(str(DEFAULT_COGNITO_IDENTITY_CLAIM), str(NONE_VALUE)));
  }
  return getIdentityClaimExp(str(ownerClaim), str(NONE_VALUE));
};

/**
 * Creates generate owner claim expression owner
 */
export const generateOwnerClaimExpression = (ownerClaim: string, idx: number): CompoundExpressionNode => {
  const expressions: Expression[] = [];
  const identityClaims = ownerClaim.split(':');
  const hasMultiIdentityClaims = identityClaims.length > 1 && ownerClaim !== 'cognito:username';

  if (hasMultiIdentityClaims) {
    expressions.push(set(ref('eachRole'), raw('[]')));
    expressions.push(set(ref(`ownerClaim${idx}`), methodCall(ref('ctx.identity.claims.get'), str(identityClaims[0]))));

    identityClaims.forEach((claim, idx2) => {
      if (idx2 === 0 || claim === 'cognito') {
        // skip
      } else if (claim === 'username') {
        expressions.push(
          set(ref(`currentClaim${idx}`), getOwnerClaim(claim)),
          set(ref(`ownerClaim${idx}`), raw(`"$ownerClaim${idx}:$currentClaim${idx}"`)),
        );
      } else {
        expressions.push(
          set(ref(`currentClaim${idx}`), methodCall(ref('ctx.identity.claims.get'), str(claim))),
          set(ref(`ownerClaim${idx}`), raw(`"$ownerClaim${idx}:$currentClaim${idx}"`)),
        );
      }
    });
  } else {
    expressions.push(
      set(ref(`ownerClaim${idx}`), getOwnerClaim(ownerClaim)),
    );
  }

  return compoundExpression(expressions);
};

/**
 * Creates response check for errors helper
 */
export const responseCheckForErrors = (): Expression => iff(ref('ctx.error'), methodCall(ref('util.error'), ref('ctx.error.message'), ref('ctx.error.type')));

// Common Expressions

/**
 * Creates generate static role expression helper
 */
export const generateStaticRoleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  const staticRoleExpression: Array<Expression> = [];
  const privateRoleIdx = roles.findIndex(r => r.strategy === 'private');
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
              compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw('#break')]),
            ),
          ]),
        ]),
      ),
    );
  }
  return staticRoleExpression;
};

/**
 * Creates api key expression helper
 */
export const apiKeyExpression = (roles: Array<RoleDefinition>): Expression => iff(
  equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)),
  compoundExpression([...(roles.length > 0 ? [set(ref(IS_AUTHORIZED_FLAG), bool(true))] : [])]),
);

/**
 * Creates lambda expression helper
 */
export const lambdaExpression = (roles: Array<RoleDefinition>): Expression => iff(
  equals(ref('util.authType()'), str(LAMBDA_AUTH_TYPE)),
  compoundExpression([...(roles.length > 0 ? [set(ref(IS_AUTHORIZED_FLAG), bool(true))] : [])]),
);

/**
 * Creates iam expression helper
 */
export const iamExpression = (
  roles: Array<RoleDefinition>,
  adminRolesEnabled: boolean,
  adminRoles: Array<string> = [],
  identityPoolId: string = undefined,
  fieldName: string = undefined,
): Expression => {
  const expression = new Array<Expression>();
  // allow if using an admin role
  if (adminRolesEnabled) {
    expression.push(iamAdminRoleCheckExpression(adminRoles, fieldName));
  }
  if (roles.length > 0) {
    roles.forEach(role => {
      expression.push(iff(not(ref(IS_AUTHORIZED_FLAG)), iamCheck(role.claim!, set(ref(IS_AUTHORIZED_FLAG), bool(true)), identityPoolId)));
    });
  } else {
    expression.push(ref('util.unauthorized()'));
  }
  return iff(equals(ref('util.authType()'), str(IAM_AUTH_TYPE)), compoundExpression(expression));
};

/**
 * Creates iam admin role check helper
 */
export const iamAdminRoleCheckExpression = (adminRoles: Array<string>, fieldName?: string): Expression => compoundExpression([
  set(ref('adminRoles'), raw(JSON.stringify(adminRoles))),
  forEach(/* for */ ref('adminRole'), /* in */ ref('adminRoles'), [
    iff(
      and([
        methodCall(ref('ctx.identity.userArn.contains'), ref('adminRole')),
        notEquals(ref('ctx.identity.userArn'), ref('ctx.stash.authRole')),
        notEquals(ref('ctx.identity.userArn'), ref('ctx.stash.unauthRole')),
      ]),
      fieldName ? raw(`#return($context.source.${fieldName})`) : raw('#return($util.toJson({}))'),
    ),
  ]),
]);

/**
 * Creates generate auth request helper
 * Get Request for Update and Delete
 */
export const generateAuthRequestExpression = (): string => {
  const statements = [
    set(ref('GetRequest'), obj({ version: str('2018-05-29'), operation: str('GetItem') })),
    ifElse(
      ref('ctx.stash.metadata.modelObjectKey'),
      set(ref('key'), ref('ctx.stash.metadata.modelObjectKey')),
      compoundExpression([set(ref('key'), obj({ id: methodCall(ref('util.dynamodb.toDynamoDB'), ref('ctx.args.input.id')) }))]),
    ),
    qref(methodCall(ref('GetRequest.put'), str('key'), ref('key'))),
    toJson(ref('GetRequest')),
  ];
  return printBlock('Get Request template')(compoundExpression(statements));
};

export const emptyPayload = toJson(raw(JSON.stringify({ version: '2018-05-29', payload: {} })));
