"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_transform_1 = require("graphql-transform");
var resources_1 = require("./resources");
var graphql_transformer_common_1 = require("graphql-transformer-common");
var graphql_1 = require("graphql");
var nManyTruthy = function (n) { return function (objs) {
    var numTruthy = 0;
    for (var _i = 0, objs_1 = objs; _i < objs_1.length; _i++) {
        var o = objs_1[_i];
        if (o) {
            numTruthy++;
        }
    }
    return numTruthy === n;
}; };
/**
 * Implements the AppSyncAuthTransformer.
 *
 * Owner Auth Usage:
 *
 * type Post @auth(allow: owner) {
 *   id: ID!
 *   title: String
 *   createdAt: String
 *   updatedAt: String
 * }
 *
 * Impact:
 *
 * getPost - In the response mapping template we check the "owner" field === $ctx.identity.username.
 * listPost - In the response mapping template we return only items where "owner" === $ctx.identity.username
 * createPost - We automatically insert a "owner" field to attribute values where "owner" === $ctx.identity.username.
 * updatePost - Expose "owner" field in input/output and would set conditional update expression to look for owner.
 * deletePost - Conditional expression checking that the owner === $ctx.identity.username
 *
 * Note: The name of the "owner" field may be configured via the CF paramaters.
 *
 * type Post @auth(allow: groups, groups: ["Admin", "Dev"]) {
 *   id: ID!
 *   title: String
 *   createdAt: String
 *   updatedAt: String
 * }
 *
 * Impact:
 *
 * getPost - Update req template to look for the groups in the identity.
 * listPost - Update req template to look for the groups in the identity.
 * createPost - Update req template to look for the groups in the identity.
 * updatePost - Update req template to look for the groups in the identity.
 * deletePost - Update req template to look for the groups in the identity.
 *
 * TODO: Document support for dynamic group authorization against
 * attributes of the records using conditional expressions. This will likely
 * be via a new argument such as "groupsField".
 */
var AppSyncAuthTransformer = /** @class */ (function (_super) {
    __extends(AppSyncAuthTransformer, _super);
    function AppSyncAuthTransformer() {
        var _this = _super.call(this, 'AppSyncAuthTransformer', "directive @auth(\n                allow: AuthStrategy!,\n                ownerField: String = \"owner\",\n                groupsField: String,\n                groups: [String],\n                queries: [ModelQuery],\n                mutations: [ModelMutation]\n            ) on OBJECT", "\n                enum AuthStrategy { owner groups }\n                enum ModelQuery { get list }\n                enum ModelMutation { create update delete }\n            ") || this;
        /**
         * Updates the GraphQL API record to use user pool auth.
         */
        _this.updateAPIForUserPools = function (ctx) {
            var apiRecord = ctx.getResource(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID);
            var updated = _this.resources.updateGraphQLAPIWithAuth(apiRecord);
            ctx.setResource(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, updated);
        };
        _this.before = function (ctx) {
            var template = _this.resources.initTemplate();
            ctx.mergeResources(template.Resources);
            ctx.mergeParameters(template.Parameters);
            ctx.mergeOutputs(template.Outputs);
            ctx.mergeConditions(template.Conditions);
            _this.updateAPIForUserPools(ctx);
        };
        _this.getQueryResolverResourceIds = function (typeName, queryEnums) {
            var ids = [];
            for (var _i = 0, queryEnums_1 = queryEnums; _i < queryEnums_1.length; _i++) {
                var queryEnum = queryEnums_1[_i];
                switch (queryEnum) {
                    case 'get':
                        ids.push(graphql_transformer_common_1.ResolverResourceIDs.DynamoDBGetResolverResourceID(typeName));
                        break;
                    case 'list':
                        ids.push(graphql_transformer_common_1.ResolverResourceIDs.DynamoDBListResolverResourceID(typeName));
                        break;
                    case 'search':
                        ids.push(graphql_transformer_common_1.ResolverResourceIDs.ElasticsearchSearchResolverResourceID(typeName));
                        break;
                }
            }
            return ids;
        };
        _this.getMutationResolverResourceIds = function (typeName, mutationEnums) {
            var ids = [];
            for (var _i = 0, mutationEnums_1 = mutationEnums; _i < mutationEnums_1.length; _i++) {
                var mutEnum = mutationEnums_1[_i];
                switch (mutEnum) {
                    case 'create':
                        ids.push(graphql_transformer_common_1.ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName));
                        break;
                    case 'update':
                        ids.push(graphql_transformer_common_1.ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName));
                        break;
                    case 'delete':
                        ids.push(graphql_transformer_common_1.ResolverResourceIDs.DynamoDBDeleteResolverResourceID(typeName));
                        break;
                }
            }
            return ids;
        };
        _this.ownerProtectQueryResolvers = function (ctx, queries, ids, ownerField) {
            for (var i = 0; i < queries.length; i++) {
                var id = ids[i];
                var query = queries[i];
                var resolver = ctx.getResource(id);
                if (resolver) {
                    // Update the resolver with the auth check.
                    if (query === 'get') {
                        ctx.setResource(id, _this.resources.ownerProtectGetResolver(resolver, ownerField));
                    }
                    else if (query === 'list') {
                        ctx.setResource(id, _this.resources.ownerProtectListResolver(resolver, ownerField));
                    }
                    // else if (query === 'search') {
                    //     ctx.setResource(id, this.resources.ownerProtectQueryResolver(resolver as Resolver))
                    // }
                }
            }
        };
        _this.ownerProtectMutationResolvers = function (ctx, mutations, ids, ownerField) {
            for (var i = 0; i < mutations.length; i++) {
                var id = ids[i];
                var mutation = mutations[i];
                var resolver = ctx.getResource(id);
                if (resolver) {
                    if (mutation === 'create') {
                        ctx.setResource(id, _this.resources.ownerProtectCreateResolver(resolver, ownerField));
                    }
                    else if (mutation === 'update') {
                        ctx.setResource(id, _this.resources.ownerProtectUpdateResolver(resolver, ownerField));
                    }
                    else if (mutation === 'delete') {
                        ctx.setResource(id, _this.resources.ownerProtectDeleteResolver(resolver, ownerField));
                    }
                }
            }
        };
        _this.staticGroupsProtectQueryResolvers = function (ctx, queries, ids, groups) {
            for (var i = 0; i < queries.length; i++) {
                var id = ids[i];
                var query = queries[i];
                var resolver = ctx.getResource(id);
                if (resolver) {
                    if (query === 'get') {
                        ctx.setResource(id, _this.resources.staticGroupProtectResolver(resolver, groups));
                    }
                    else if (query === 'list') {
                        ctx.setResource(id, _this.resources.staticGroupProtectResolver(resolver, groups));
                    }
                    else if (query === 'search') {
                        // TODO: Test this when @searchable is ready
                        ctx.setResource(id, _this.resources.staticGroupProtectResolver(resolver, groups));
                    }
                }
            }
        };
        _this.staticGroupsProtectMutationResolvers = function (ctx, mutations, ids, groups) {
            for (var i = 0; i < mutations.length; i++) {
                var id = ids[i];
                var mutation = mutations[i];
                var resolver = ctx.getResource(id);
                if (resolver) {
                    if (mutation === 'create') {
                        ctx.setResource(id, _this.resources.staticGroupProtectResolver(resolver, groups));
                    }
                    else if (mutation === 'update') {
                        ctx.setResource(id, _this.resources.staticGroupProtectResolver(resolver, groups));
                    }
                    else if (mutation === 'delete') {
                        ctx.setResource(id, _this.resources.staticGroupProtectResolver(resolver, groups));
                    }
                }
            }
        };
        _this.dynamicGroupsProtectQueryResolvers = function (ctx, queries, ids, groupsField) {
            for (var i = 0; i < queries.length; i++) {
                var id = ids[i];
                var query = queries[i];
                var resolver = ctx.getResource(id);
                if (resolver) {
                    if (query === 'get') {
                        ctx.setResource(id, _this.resources.dynamicGroupProtectGetResolver(resolver, groupsField));
                    }
                    else if (query === 'list') {
                        ctx.setResource(id, _this.resources.dynamicGroupProtectListResolver(resolver, groupsField));
                    }
                    // else if (query === 'search') {
                    //     ctx.setResource(id, this.resources.dynamicGroupProtectDeleteResolver(resolver as Resolver, groupsField))
                    // }
                }
            }
        };
        _this.dynamicGroupsProtectMutationResolvers = function (ctx, mutations, ids, groupsField) {
            for (var i = 0; i < mutations.length; i++) {
                var id = ids[i];
                var mutation = mutations[i];
                var resolver = ctx.getResource(id);
                if (resolver) {
                    if (mutation === 'create') {
                        ctx.setResource(id, _this.resources.dynamicGroupProtectCreateResolver(resolver, groupsField));
                    }
                    else if (mutation === 'update') {
                        ctx.setResource(id, _this.resources.dynamicGroupProtectUpdateResolver(resolver, groupsField));
                    }
                    else if (mutation === 'delete') {
                        ctx.setResource(id, _this.resources.dynamicGroupProtectDeleteResolver(resolver, groupsField));
                    }
                }
            }
        };
        /**
         * Implement the transform for an object type. Depending on which operations are to be protected
         */
        _this.object = function (def, directive, ctx) {
            var get = function (s) { return function (arg) { return arg.name.value === s; }; };
            var getArg = function (arg, dflt) {
                var argument = directive.arguments.find(get(arg));
                return argument ? graphql_1.valueFromASTUntyped(argument.value) : dflt;
            };
            var modelDirective = def.directives.find(function (dir) { return dir.name.value === 'model'; });
            if (!modelDirective) {
                throw new graphql_transform_1.InvalidDirectiveError('Types annotated with @auth must also be annotated with @model.');
            }
            // Get the auth strategy for this transformer
            var authStrategy = getArg('allow');
            // Protect only those specified else all of them.
            var queriesToProtect = getArg('queries', ['get', 'list', 'search']);
            // Protect only those specified else all of them.
            var mutationsToProtect = getArg('mutations', ['create', 'update', 'delete']);
            // Map from the enums to the actual resource ids in the context
            var typeName = def.name.value;
            var queryResolverResourceIds = _this.getQueryResolverResourceIds(typeName, queriesToProtect);
            var mutationResolverResourceIds = _this.getMutationResolverResourceIds(typeName, mutationsToProtect);
            if (authStrategy === 'owner') {
                // If there exists a resolver that needs to be protected then protect it.
                var ownerField = getArg('ownerField');
                _this.ownerProtectQueryResolvers(ctx, queriesToProtect, queryResolverResourceIds, ownerField);
                _this.ownerProtectMutationResolvers(ctx, mutationsToProtect, mutationResolverResourceIds, ownerField);
            }
            else if (authStrategy === 'groups') {
                // If there exists a resolver that needs to be protected then protect it.
                var groupsField = getArg('groupsField');
                var groups = getArg('groups');
                if ((groups && groupsField) || (!groups && !groupsField)) {
                    throw new graphql_transform_1.InvalidDirectiveError("The @auth directive takes exactly one of [groups, groupsField]");
                }
                if (groups) {
                    _this.staticGroupsProtectQueryResolvers(ctx, queriesToProtect, queryResolverResourceIds, groups);
                    _this.staticGroupsProtectMutationResolvers(ctx, mutationsToProtect, mutationResolverResourceIds, groups);
                }
                else {
                    _this.dynamicGroupsProtectQueryResolvers(ctx, queriesToProtect, queryResolverResourceIds, groupsField);
                    _this.dynamicGroupsProtectMutationResolvers(ctx, mutationsToProtect, mutationResolverResourceIds, groupsField);
                }
            }
        };
        _this.resources = new resources_1.ResourceFactory();
        return _this;
    }
    return AppSyncAuthTransformer;
}(graphql_transform_1.Transformer));
exports.AppSyncAuthTransformer = AppSyncAuthTransformer;
//# sourceMappingURL=AppSyncAuthTransformer.js.map