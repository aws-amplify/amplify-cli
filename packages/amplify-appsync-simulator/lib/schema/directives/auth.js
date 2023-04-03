"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthDirectives = exports.getAuthDirectiveTransformer = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("@graphql-tools/utils");
const type_definition_1 = require("../../type-definition");
const util_1 = require("../../velocity/util");
const AUTH_DIRECTIVES = {
    aws_api_key: 'directive @aws_api_key on FIELD_DEFINITION | OBJECT',
    aws_iam: 'directive @aws_iam on FIELD_DEFINITION | OBJECT',
    aws_oidc: 'directive @aws_oidc on FIELD_DEFINITION | OBJECT',
    aws_lambda: 'directive @aws_lambda on FIELD_DEFINITION | OBJECT',
    aws_cognito_user_pools: 'directive @aws_cognito_user_pools(cognito_groups: [String!]) on FIELD_DEFINITION | OBJECT',
    aws_auth: 'directive @aws_auth(cognito_groups: [String!]!) on FIELD_DEFINITION',
};
const AUTH_TYPE_TO_DIRECTIVE_MAP = {
    aws_api_key: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
    aws_iam: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_IAM,
    aws_auth: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    aws_cognito_user_pools: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS,
    aws_oidc: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT,
    aws_lambda: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AWS_LAMBDA,
};
const getAuthDirectiveTransformer = (simulatorContext) => {
    return (schema) => {
        return (0, utils_1.mapSchema)(schema, {
            [utils_1.MapperKind.OBJECT_TYPE]: (obj) => {
                const fields = obj.getFields();
                Object.values(fields).forEach((field) => {
                    const allowedAuthTypes = getFieldAuthType(field, obj, simulatorContext);
                    const allowedCognitoGroups = getAllowedCognitoGroups(field, obj);
                    const resolve = field.resolve;
                    const newResolver = (root, args, ctx, info) => {
                        const currentAuthMode = ctx.requestAuthorizationMode;
                        if (!allowedAuthTypes.includes(currentAuthMode)) {
                            const err = new util_1.Unauthorized(`Not Authorized to access ${field.name} on type ${obj.name}`, info);
                            throw err;
                        }
                        if (ctx.requestAuthorizationMode === type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS &&
                            allowedCognitoGroups.length) {
                            const groups = getCognitoGroups(ctx.jwt || {});
                            const authorized = groups.some((group) => allowedCognitoGroups.includes(group));
                            if (!authorized) {
                                const err = new util_1.Unauthorized(`Not Authorized to access ${field.name} on type ${obj.name}`, info);
                                throw err;
                            }
                        }
                        return (resolve || graphql_1.defaultFieldResolver)(root, args, ctx, info);
                    };
                    field.resolve = newResolver;
                });
                return obj;
            },
        });
    };
};
exports.getAuthDirectiveTransformer = getAuthDirectiveTransformer;
const getAuthDirectives = () => {
    return Object.values(AUTH_DIRECTIVES).join('\n');
};
exports.getAuthDirectives = getAuthDirectives;
function getFieldAuthType(fieldConfig, object, simulator) {
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
function getAllowedCognitoGroups(field, parentField) {
    const cognito_auth_directives = ['aws_auth', 'aws_cognito_user_pools'];
    const fieldDirectives = field.astNode.directives;
    const fieldAuthDirectives = getAuthDirective(fieldDirectives);
    if (fieldAuthDirectives.length) {
        return fieldDirectives
            .filter((d) => cognito_auth_directives.includes(d.name.value))
            .reduce((acc, d) => [...acc, ...getDirectiveArgumentValues(d, 'cognito_groups')], []);
    }
    const parentAuthDirectives = getAuthDirective(parentField.astNode.directives);
    if (parentAuthDirectives.length) {
        return parentField.astNode.directives
            .filter((d) => (d) => cognito_auth_directives.includes(d.name.value))
            .reduce((acc, d) => [...acc, ...getDirectiveArgumentValues(d, 'cognito_groups')], []);
    }
    return [];
}
function getAuthDirective(directives) {
    const authDirectiveNames = Object.keys(AUTH_DIRECTIVES);
    return Array.from(new Set(directives
        .map((d) => d.name.value)
        .filter((d) => authDirectiveNames.includes(d))
        .map((d) => AUTH_TYPE_TO_DIRECTIVE_MAP[d])).values());
}
function getDirectiveArgumentValues(directives, argName) {
    return directives.arguments
        .filter((arg) => arg.name.value === argName)
        .reduce((acc, arg) => [...acc, ...(0, graphql_1.valueFromASTUntyped)(arg.value)], []);
}
function getCognitoGroups(token = {}) {
    return token['cognito:groups'] ? token['cognito:groups'] : [];
}
//# sourceMappingURL=auth.js.map