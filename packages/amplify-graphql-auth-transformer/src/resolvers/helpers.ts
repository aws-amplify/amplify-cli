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
} from 'graphql-mapping-template';
import { NONE_VALUE } from 'graphql-transformer-common';
import {
  DEFAULT_COGNITO_IDENTITY_CLAIM,
  RoleDefinition,
  IS_AUTHORIZED_FLAG,
  ALLOWED_FIELDS,
  API_KEY_AUTH_TYPE,
  ADMIN_ROLE,
  IAM_AUTH_TYPE,
  MANAGE_ROLE,
} from '../utils';

// note in the resolver that operation is protected by auth
export const setHasAuthExpression: Expression = qref(methodCall(ref('ctx.stash.put'), str('hasAuth'), bool(true)));

// since the keySet returns a set we can convert it to a list by converting to json and parsing back as a list
export const getInputFields = (): Expression => {
  return set(ref('inputFields'), methodCall(ref('util.parseJson'), methodCall(ref('util.toJson'), ref('ctx.args.input.keySet()'))));
};

export const getIdentityClaimExp = (value: Expression, defaultValueExp: Expression): Expression => {
  return methodCall(ref('util.defaultIfNull'), methodCall(ref('ctx.identity.claims.get'), value), defaultValueExp);
};

// for create mutations and subscriptions
export const addAllowedFieldsIfElse = (fieldKey: string, breakLoop: boolean = false): Expression => {
  return ifElse(
    not(ref(`${fieldKey}.isEmpty()`)),
    qref(methodCall(ref(`${ALLOWED_FIELDS}.addAll`), ref(fieldKey))),
    compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), ...(breakLoop ? [raw('#break')] : [])]),
  );
};

// iam check
export const iamCheck = (claim: string, exp: Expression) => iff(equals(ref('ctx.identity.userArn'), ref(`ctx.stash.${claim}`)), exp);

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

export const responseCheckForErrors = () =>
  iff(ref('ctx.error'), methodCall(ref('util.error'), ref('ctx.error.message'), ref('ctx.error.type')));

// Common Expressions

export const generateStaticRoleExpression = (roles: Array<RoleDefinition>): Array<Expression> => {
  const staticRoleExpression: Array<Expression> = new Array();
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
              compoundExpression([set(ref(IS_AUTHORIZED_FLAG), bool(true)), raw(`#break`)]),
            ),
          ]),
        ]),
      ),
    );
  }
  return staticRoleExpression;
};

export const apiKeyExpression = (roles: Array<RoleDefinition>) =>
  iff(
    equals(ref('util.authType()'), str(API_KEY_AUTH_TYPE)),
    compoundExpression([...(roles.length > 0 ? [set(ref(IS_AUTHORIZED_FLAG), bool(true))] : [])]),
  );

export const iamExpression = (roles: Array<RoleDefinition>, adminuiEnabled: boolean = false, adminUserPoolID?: string) => {
  const expression = new Array<Expression>();
  // allow if using admin ui
  if (adminuiEnabled) {
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
      expression.push(iff(not(ref(IS_AUTHORIZED_FLAG)), iamCheck(role.claim!, set(ref(IS_AUTHORIZED_FLAG), bool(true)))));
    }
  }
  return iff(equals(ref('util.authType()'), str(IAM_AUTH_TYPE)), compoundExpression(expression));
};

// Get Request for Update and Delete
export const generateAuthRequestExpression = () => {
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
