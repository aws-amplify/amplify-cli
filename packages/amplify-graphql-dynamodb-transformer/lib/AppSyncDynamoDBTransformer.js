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
var amplify_graphql_transform_1 = require("amplify-graphql-transform");
var graphql_1 = require("graphql");
var resources_1 = require("./resources");
var definitions_1 = require("./definitions");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
/**
 * The simple transform.
 *
 * This transform creates a single DynamoDB table for all of your application's
 * data. It uses a standard key structure and nested map to store object values.
 * A relationKey field
 *
 * {
 *  type (HASH),
 *  id (SORT),
 *  value (MAP),
 *  createdAt, (LSI w/ type)
 *  updatedAt (LSI w/ type)
 * }
 */
var AppSyncDynamoDBTransformer = /** @class */ (function (_super) {
    __extends(AppSyncDynamoDBTransformer, _super);
    function AppSyncDynamoDBTransformer() {
        var _this = _super.call(this, 'AppSyncDynamoDBTransformer', "directive @model(queries: DynamoDBQueryMap, mutations: DynamoDBMutationMap) on OBJECT", "\n                input DynamoDBMutationMap { create: String, update: String, delete: String }\n                input DynamoDBQueryMap { get: String, list: String, query: String }\n            ") || this;
        _this.before = function (ctx) {
            var template = _this.resources.initTemplate();
            ctx.mergeResources(template.Resources);
            ctx.mergeParameters(template.Parameters);
            ctx.mergeOutputs(template.Outputs);
            var queryType = amplify_graphql_transformer_common_1.blankObject('Query');
            var mutationType = amplify_graphql_transformer_common_1.blankObject('Mutation');
            ctx.addObject(mutationType);
            ctx.addObject(queryType);
            var schema = amplify_graphql_transformer_common_1.makeSchema([
                amplify_graphql_transformer_common_1.makeOperationType('query', 'Query'),
                amplify_graphql_transformer_common_1.makeOperationType('mutation', 'Mutation')
            ]);
            ctx.addSchema(schema);
            // Some downstream resources depend on this so put a placeholder in and
            // overwrite it in the after
            var schemaResource = _this.resources.makeAppSyncSchema('placeholder');
            ctx.setResource(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource);
        };
        _this.after = function (ctx) {
            var built = graphql_1.buildASTSchema({
                kind: 'Document',
                definitions: Object.keys(ctx.nodeMap).map(function (k) { return ctx.nodeMap[k]; })
            });
            var SDL = graphql_1.printSchema(built);
            var schemaResource = _this.resources.makeAppSyncSchema(SDL);
            ctx.setResource(amplify_graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource);
        };
        /**
         * Given the initial input and context manipulate the context to handle this object directive.
         * @param initial The input passed to the transform.
         * @param ctx The accumulated context for the transform.
         */
        _this.object = function (def, directive, ctx) {
            // Create the object type.
            ctx.addObject(def);
            // Create the input types.
            var createInput = definitions_1.makeCreateInputObject(def);
            var updateInput = definitions_1.makeUpdateInputObject(def);
            var deleteInput = definitions_1.makeDeleteInputObject(def);
            ctx.addInput(createInput);
            ctx.addInput(updateInput);
            ctx.addInput(deleteInput);
            // Create the mutation & query extension
            var mutationType = amplify_graphql_transformer_common_1.blankObjectExtension('Mutation');
            var queryType = amplify_graphql_transformer_common_1.blankObjectExtension('Query');
            // Get any name overrides provided by the user. If an empty map it provided
            // then we do not generate those fields.
            var directiveArguments = _super.prototype.getDirectiveArgumentMap.call(_this, directive);
            var shouldMakeCreate = true;
            var shouldMakeUpdate = true;
            var shouldMakeDelete = true;
            var shouldMakeGet = true;
            var shouldMakeQuery = true;
            var shouldMakeList = true;
            var createFieldNameOverride = undefined;
            var updateFieldNameOverride = undefined;
            var deleteFieldNameOverride = undefined;
            var getFieldNameOverride = undefined;
            var listFieldNameOverride = undefined;
            var queryFieldNameOverride = undefined;
            // Figure out which queries to make and if they have name overrides.
            if (directiveArguments.queries) {
                if (!directiveArguments.queries.get) {
                    shouldMakeGet = false;
                }
                else {
                    getFieldNameOverride = directiveArguments.queries.get;
                }
                if (!directiveArguments.queries.query) {
                    shouldMakeQuery = false;
                }
                else {
                    queryFieldNameOverride = directiveArguments.queries.query;
                }
                if (!directiveArguments.queries.list) {
                    shouldMakeList = false;
                }
                else {
                    listFieldNameOverride = directiveArguments.queries.list;
                }
            }
            // Figure out which mutations to make and if they have name overrides
            if (directiveArguments.mutations) {
                if (!directiveArguments.mutations.create) {
                    shouldMakeCreate = false;
                }
                else {
                    createFieldNameOverride = directiveArguments.mutations.create;
                }
                if (!directiveArguments.mutations.update) {
                    shouldMakeUpdate = false;
                }
                else {
                    updateFieldNameOverride = directiveArguments.mutations.update;
                }
                if (!directiveArguments.mutations.delete) {
                    shouldMakeDelete = false;
                }
                else {
                    deleteFieldNameOverride = directiveArguments.mutations.delete;
                }
            }
            var queryNameMap = directiveArguments.queries;
            var mutationNameMap = directiveArguments.mutations;
            // Create the mutations.
            if (shouldMakeCreate) {
                var createResolver = _this.resources.makeCreateResolver(def.name.value, createFieldNameOverride);
                ctx.setResource("Create" + def.name.value + "Resolver", createResolver);
                mutationType = amplify_graphql_transformer_common_1.extensionWithFields(mutationType, [amplify_graphql_transformer_common_1.makeField(createResolver.Properties.FieldName, [amplify_graphql_transformer_common_1.makeArg('input', amplify_graphql_transformer_common_1.makeNonNullType(amplify_graphql_transformer_common_1.makeNamedType(createInput.name.value)))], amplify_graphql_transformer_common_1.makeNamedType(def.name.value))]);
            }
            if (shouldMakeUpdate) {
                var updateResolver = _this.resources.makeUpdateResolver(def.name.value, updateFieldNameOverride);
                ctx.setResource("Update" + def.name.value + "Resolver", updateResolver);
                mutationType = amplify_graphql_transformer_common_1.extensionWithFields(mutationType, [amplify_graphql_transformer_common_1.makeField(updateResolver.Properties.FieldName, [amplify_graphql_transformer_common_1.makeArg('input', amplify_graphql_transformer_common_1.makeNonNullType(amplify_graphql_transformer_common_1.makeNamedType(updateInput.name.value)))], amplify_graphql_transformer_common_1.makeNamedType(def.name.value))]);
            }
            if (shouldMakeDelete) {
                var deleteResolver = _this.resources.makeDeleteResolver(def.name.value, deleteFieldNameOverride);
                ctx.setResource("Delete" + def.name.value + "Resolver", deleteResolver);
                mutationType = amplify_graphql_transformer_common_1.extensionWithFields(mutationType, [amplify_graphql_transformer_common_1.makeField(deleteResolver.Properties.FieldName, [amplify_graphql_transformer_common_1.makeArg('input', amplify_graphql_transformer_common_1.makeNonNullType(amplify_graphql_transformer_common_1.makeNamedType(deleteInput.name.value)))], amplify_graphql_transformer_common_1.makeNamedType(def.name.value))]);
            }
            ctx.addObjectExtension(mutationType);
            // Create query queries
            if (shouldMakeQuery) {
                _this.generateTableXConnectionType(ctx, def);
                var queryResolver = _this.resources.makeQueryResolver(def.name.value, queryFieldNameOverride);
                ctx.setResource("Query" + def.name.value + "Resolver", queryResolver);
                queryType = amplify_graphql_transformer_common_1.extensionWithFields(queryType, [amplify_graphql_transformer_common_1.makeField(queryResolver.Properties.FieldName, [
                        amplify_graphql_transformer_common_1.makeArg('filter', amplify_graphql_transformer_common_1.makeNamedType("Table" + def.name.value + "FilterInput")),
                        amplify_graphql_transformer_common_1.makeArg('sortDirection', amplify_graphql_transformer_common_1.makeNamedType('TableSortDirection')),
                        amplify_graphql_transformer_common_1.makeArg('limit', amplify_graphql_transformer_common_1.makeNamedType('Int')),
                        amplify_graphql_transformer_common_1.makeArg('nextToken', amplify_graphql_transformer_common_1.makeNamedType('String'))
                    ], amplify_graphql_transformer_common_1.makeNamedType("Table" + def.name.value + "Connection"))]);
                if (!_this.typeExist('TableSortDirection', ctx)) {
                    var tableSortDirection = definitions_1.makeTableSortDirectionEnumObject();
                    ctx.addEnum(tableSortDirection);
                }
                _this.generateFilterInputs(ctx, def);
            }
            // Create get queries
            if (shouldMakeGet) {
                var getResolver = _this.resources.makeGetResolver(def.name.value, getFieldNameOverride);
                ctx.setResource("Get" + def.name.value + "Resolver", getResolver);
                queryType = amplify_graphql_transformer_common_1.extensionWithFields(queryType, [amplify_graphql_transformer_common_1.makeField(getResolver.Properties.FieldName, [amplify_graphql_transformer_common_1.makeArg('id', amplify_graphql_transformer_common_1.makeNonNullType(amplify_graphql_transformer_common_1.makeNamedType('ID')))], amplify_graphql_transformer_common_1.makeNamedType(def.name.value))]);
            }
            if (shouldMakeList) {
                _this.generateTableXConnectionType(ctx, def);
                // Create the list resolver
                var listResolver = _this.resources.makeListResolver(def.name.value, listFieldNameOverride);
                ctx.setResource("List" + def.name.value + "Resolver", listResolver);
                _this.generateFilterInputs(ctx, def);
                // Extend the query type to include listX
                queryType = amplify_graphql_transformer_common_1.extensionWithFields(queryType, [amplify_graphql_transformer_common_1.makeField(listResolver.Properties.FieldName, [
                        amplify_graphql_transformer_common_1.makeArg('filter', amplify_graphql_transformer_common_1.makeNamedType("Table" + def.name.value + "FilterInput")),
                        amplify_graphql_transformer_common_1.makeArg('limit', amplify_graphql_transformer_common_1.makeNamedType('Int')),
                        amplify_graphql_transformer_common_1.makeArg('nextToken', amplify_graphql_transformer_common_1.makeNamedType('String'))
                    ], amplify_graphql_transformer_common_1.makeNamedType("Table" + def.name.value + "Connection"))]);
            }
            ctx.addObjectExtension(queryType);
        };
        _this.resources = new resources_1.ResourceFactory();
        return _this;
    }
    AppSyncDynamoDBTransformer.prototype.typeExist = function (type, ctx) {
        return Boolean(type in ctx.nodeMap);
    };
    AppSyncDynamoDBTransformer.prototype.generateTableXConnectionType = function (ctx, def) {
        var tableXConnectionName = "Table" + def.name.value + "Connection";
        if (this.typeExist(tableXConnectionName, ctx)) {
            return;
        }
        // Create the TableXConnection
        var connectionType = amplify_graphql_transformer_common_1.blankObject(tableXConnectionName);
        ctx.addObject(connectionType);
        // Create TableXConnection type with items and nextToken
        var connectionTypeExtension = amplify_graphql_transformer_common_1.blankObjectExtension(tableXConnectionName);
        connectionTypeExtension = amplify_graphql_transformer_common_1.extensionWithFields(connectionTypeExtension, [amplify_graphql_transformer_common_1.makeField('items', [], amplify_graphql_transformer_common_1.makeListType(amplify_graphql_transformer_common_1.makeNamedType(def.name.value)))]);
        connectionTypeExtension = amplify_graphql_transformer_common_1.extensionWithFields(connectionTypeExtension, [amplify_graphql_transformer_common_1.makeField('nextToken', [], amplify_graphql_transformer_common_1.makeNamedType('String'))]);
        ctx.addObjectExtension(connectionTypeExtension);
    };
    AppSyncDynamoDBTransformer.prototype.generateFilterInputs = function (ctx, def) {
        // Create the Scalar filter inputs
        if (!this.typeExist('TableStringFilterInput', ctx)) {
            var tableStringFilterInput = definitions_1.makeTableScalarFilterInputObject('String');
            ctx.addInput(tableStringFilterInput);
        }
        if (!this.typeExist('TableIDFilterInput', ctx)) {
            var tableIDFilterInput = definitions_1.makeTableScalarFilterInputObject('ID');
            ctx.addInput(tableIDFilterInput);
        }
        if (!this.typeExist('TableIntFilterInput', ctx)) {
            var tableIntFilterInput = definitions_1.makeTableScalarFilterInputObject('Int');
            ctx.addInput(tableIntFilterInput);
        }
        if (!this.typeExist('TableFloatFilterInput', ctx)) {
            var tableFloatFilterInput = definitions_1.makeTableScalarFilterInputObject('Float');
            ctx.addInput(tableFloatFilterInput);
        }
        if (!this.typeExist('TableBooleanFilterInput', ctx)) {
            var tableBooleanFilterInput = definitions_1.makeTableScalarFilterInputObject('Boolean');
            ctx.addInput(tableBooleanFilterInput);
        }
        // Create the TableXFilterInput
        if (!this.typeExist("Table" + def.name.value + "FilterInput", ctx)) {
            var tableXQueryFilterInput = definitions_1.makeTableXFilterInputObject(def);
            ctx.addInput(tableXQueryFilterInput);
        }
    };
    return AppSyncDynamoDBTransformer;
}(amplify_graphql_transform_1.Transformer));
exports.AppSyncDynamoDBTransformer = AppSyncDynamoDBTransformer;
//# sourceMappingURL=AppSyncDynamoDBTransformer.js.map