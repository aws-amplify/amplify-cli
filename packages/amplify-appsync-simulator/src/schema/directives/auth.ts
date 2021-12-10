import {
  GraphQLField,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
  defaultFieldResolver,
  DirectiveNode,
  valueFromASTUntyped,
} from 'graphql';
import { mapSchema, MapperKind } from '@graphql-tools/utils';
import { AmplifyAppSyncSimulator, AmplifyAppSyncSimulatorRequestContext } from '../..';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';
import { Unauthorized } from '../../velocity/util';

const AUTH_DIRECTIVES = {
  aws_api_key: 'directive @aws_api_key on FIELD_DEFINITION | OBJECT',
  aws_iam: 'directive @aws_iam on FIELD_DEFINITION | OBJECT',
  aws_oidc: 'directive @aws_oidc on FIELD_DEFINITION | OBJECT',
  aws_lambda: 'directive @aws_lambda on FIELD_DEFINITION | OBJECT',
  aws_cognito_user_pools: 'directive @aws_cognito_user_pools(cognito_groups: [String!]) on FIELD_DEFINITION | OBJECT',
  aws_auth: 'directive @aws_auth(cognito_groups: [String!]!) on FIELD_DEFINITION',
};

const AUTH_TYPE_TO_DIRECTIVE_MAP: {
  [K: string]: AmplifyAppSyncSimulatorAuthenticationType;
} = {
  aws_api_key: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
  aws_iam: AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
  aws_auth: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
  aws_cognito_user_pools: AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
  aws_oidc: AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
  aws_lambda: AmplifyAppSyncSimulatorAuthenticationType.AWS_LAMBDA,
};

export const getAuthDirectiveTransformer = (simulatorContext: AmplifyAppSyncSimulator): ((schema: GraphQLSchema) => GraphQLSchema) => {
  return (schema: GraphQLSchema) => {
    return mapSchema(schema, {
      [MapperKind.OBJECT_TYPE]: obj => {
        const fields = obj.getFields();
        Object.values(fields).forEach(field => {
          const allowedAuthTypes = getFieldAuthType(field, obj, simulatorContext);
          const allowedCognitoGroups = getAllowedCognitoGroups(field, obj);
          const resolve = field.resolve;
          const newResolver = (root, args, ctx: AmplifyAppSyncSimulatorRequestContext, info: GraphQLResolveInfo) => {
            const currentAuthMode = ctx.requestAuthorizationMode;
            if (!allowedAuthTypes.includes(currentAuthMode)) {
              const err = new Unauthorized(`Not Authorized to access ${field.name} on type ${obj.name}`, info);
              throw err;
            }
            if (
              ctx.requestAuthorizationMode === AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS &&
              allowedCognitoGroups.length
            ) {
              const groups = getCognitoGroups(ctx.jwt || {});
              const authorized = groups.some(group => allowedCognitoGroups.includes(group));
              if (!authorized) {
                const err = new Unauthorized(`Not Authorized to access ${field.name} on type ${obj.name}`, info);
                throw err;
              }
            }
            return (resolve || defaultFieldResolver)(root, args, ctx, info);
          };

          field.resolve = newResolver;
        });
        return obj;
      },
    });
  };
};

export const getAuthDirectives = () => {
  return Object.values(AUTH_DIRECTIVES).join('\n');
};

function getFieldAuthType(fieldConfig: GraphQLField<any, any>, object: GraphQLObjectType, simulator: AmplifyAppSyncSimulator): string[] {
  const fieldAuthDirectives = getAuthDirective(fieldConfig.astNode.directives);
  if (fieldAuthDirectives.length) {
    return fieldAuthDirectives;
  }
  const typeAuthDirectives = getAuthDirective(object.astNode.directives);
  if (typeAuthDirectives.length) {
    return typeAuthDirectives;
  }
  return [simulator.appSyncConfig.defaultAuthenticationType.authenticationType];
}

function getAllowedCognitoGroups(field: GraphQLField<any, any>, parentField: GraphQLObjectType) {
  const cognito_auth_directives = ['aws_auth', 'aws_cognito_user_pools'];
  const fieldDirectives = field.astNode.directives;
  const fieldAuthDirectives = getAuthDirective(fieldDirectives);
  if (fieldAuthDirectives.length) {
    return fieldDirectives
      .filter(d => cognito_auth_directives.includes(d.name.value))
      .reduce((acc, d) => [...acc, ...getDirectiveArgumentValues(d, 'cognito_groups')], []);
  }

  const parentAuthDirectives = getAuthDirective(parentField.astNode.directives);
  if (parentAuthDirectives.length) {
    return parentField.astNode.directives
      .filter(d => d => cognito_auth_directives.includes(d.name.value))
      .reduce((acc, d) => [...acc, ...getDirectiveArgumentValues(d, 'cognito_groups')], []);
  }
  return [];
}

function getAuthDirective(directives: ReadonlyArray<DirectiveNode>) {
  const authDirectiveNames = Object.keys(AUTH_DIRECTIVES);
  return Array.from(
    new Set(
      directives
        .map(d => d.name.value)
        .filter(d => authDirectiveNames.includes(d))
        .map(d => AUTH_TYPE_TO_DIRECTIVE_MAP[d]),
    ).values(),
  );
}

function getDirectiveArgumentValues(directives: DirectiveNode, argName: string) {
  return directives.arguments
    .filter(arg => arg.name.value === argName)
    .reduce((acc, arg) => [...acc, ...valueFromASTUntyped(arg.value)], []);
}

function getCognitoGroups(token = {}): string[] {
  return token['cognito:groups'] ? token['cognito:groups'] : [];
}
