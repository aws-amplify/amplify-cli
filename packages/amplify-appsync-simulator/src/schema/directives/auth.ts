import { defaultFieldResolver, DirectiveNode, GraphQLObjectType, GraphQLSchema, valueFromASTUntyped, GraphQLResolveInfo } from 'graphql';
import { buildSchemaFromTypeDefinitions, forEachField } from 'graphql-tools';
import { AmplifyAppSyncSimulator } from '../..';
import { AmplifyAppSyncSimulatorAuthenticationType, AmplifyAppSyncSimulatorRequestContext } from '../../type-definition';
import { Unauthorized } from '../../velocity/util';
import { AppSyncSimulatorDirectiveBase } from './directive-base';

const AUTH_DIRECTIVES = {
  aws_api_key: 'directive @aws_api_key on FIELD_DEFINITION | OBJECT',
  aws_iam: 'directive @aws_iam on FIELD_DEFINITION | OBJECT',
  aws_oidc: 'directive @aws_oidc on FIELD_DEFINITION | OBJECT',
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
};

export class AwsAuth extends AppSyncSimulatorDirectiveBase {
  private authMapping;
  static typeDefinitions: string = Object.values(AUTH_DIRECTIVES)
    .map(d => d)
    .join('\n');

  visitFieldDefinition() {}

  visitObject(object: GraphQLObjectType) {}
}

function getResolver(resolverMap, typeName, fieldName) {
  if (resolverMap && resolverMap[typeName] && resolverMap[typeName][fieldName]) {
    return resolverMap[typeName][fieldName];
  }
  return false;
}
function getAuthDirectiveForField(
  schema: GraphQLSchema,
  field,
  typeName: string,
  simulator: AmplifyAppSyncSimulator
): AmplifyAppSyncSimulatorAuthenticationType[] {
  const fieldDirectives = field.astNode.directives;
  const parentField = schema.getType(typeName);
  const fieldAuthDirectives = getAuthDirective(fieldDirectives);
  const parentAuthDirectives = getAuthDirective(parentField.astNode.directives);
  const allowedDirectives = fieldAuthDirectives.length ? fieldAuthDirectives : parentAuthDirectives.length ? parentAuthDirectives : [];
  const allowedAuthModes: Set<AmplifyAppSyncSimulatorAuthenticationType> = new Set();
  return allowedDirectives.length
    ? Array.from(allowedDirectives.reduce((acc, directive) => acc.add(AUTH_TYPE_TO_DIRECTIVE_MAP[directive]), allowedAuthModes).values())
    : [simulator.appSyncConfig.defaultAuthenticationType.authenticationType];
}

function getAllowedCognitoGroups(schema: GraphQLSchema, field, typeName: string) {
  const cognito_auth_directives = ['aws_auth', 'aws_cognito_user_pools'];
  const fieldDirectives = field.astNode.directives;
  const parentField = schema.getType(typeName);
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
  return directives.map(d => d.name.value).filter(d => authDirectiveNames.includes(d));
}

function getDirectiveArgumentValues(directives: DirectiveNode, argName: string) {
  return directives.arguments
    .filter(arg => arg.name.value === argName)
    .reduce((acc, arg) => [...acc, ...valueFromASTUntyped(arg.value)], []);
}

export function protectResolversWithAuthRules(typeDef, existingResolvers, simulator: AmplifyAppSyncSimulator) {
  const schema = buildSchemaFromTypeDefinitions(typeDef);
  const newResolverMap = {};
  forEachField(schema, (field, typeName, fieldName) => {
    const fieldResolver = getResolver(existingResolvers, typeName, fieldName);
    const allowedAuthTypes = getAuthDirectiveForField(schema, field, typeName, simulator);
    const allowedCognitoGroups = getAllowedCognitoGroups(schema, field, typeName);

    const newResolver = (root, args, ctx: AmplifyAppSyncSimulatorRequestContext, info: GraphQLResolveInfo) => {
      const currentAuthMode = ctx.requestAuthorizationMode;
      if (!allowedAuthTypes.includes(currentAuthMode)) {
        const err = new Unauthorized(`Not Authorized to access ${fieldName} on type ${typeName}`, info);
        throw err;
      }
      if (
        ctx.requestAuthorizationMode === AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS &&
        allowedCognitoGroups.length
      ) {
        const groups = getCognitoGroups(ctx.jwt || {});
        const authorized = groups.some(group => allowedCognitoGroups.includes(group));
        if (!authorized) {
          const err = new Unauthorized(`Not Authorized to access ${fieldName} on type ${typeName}`, info.operation.loc);
          throw err;
        }
      }
      return (fieldResolver.resolve || defaultFieldResolver)(root, args, ctx, info);
    };
    if (!newResolverMap[typeName]) {
      newResolverMap[typeName] = {};
    }
    newResolverMap[typeName][fieldName] = { ...fieldResolver, resolve: newResolver };
  });
  return newResolverMap;
}

function getCognitoGroups(token = {}): string[] {
  return token['cognito:groups'] ? token['cognito:groups'] : [];
}
