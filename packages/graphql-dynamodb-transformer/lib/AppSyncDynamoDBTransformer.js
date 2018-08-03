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
var definitions_1 = require("./definitions");
var graphql_transformer_common_1 = require("graphql-transformer-common");
var graphql_transformer_common_2 = require("graphql-transformer-common");
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
        var _this = _super.call(this, 'AppSyncDynamoDBTransformer', "directive @model(\n                queries: ModelQueryMap,\n                mutations: ModelMutationMap\n            ) on OBJECT", "\n                input ModelMutationMap { create: String, update: String, delete: String }\n                input ModelQueryMap { get: String, list: String }\n            ") || this;
        _this.before = function (ctx) {
            var template = _this.resources.initTemplate();
            ctx.mergeResources(template.Resources);
            ctx.mergeParameters(template.Parameters);
            ctx.mergeOutputs(template.Outputs);
        };
        /**
         * Given the initial input and context manipulate the context to handle this object directive.
         * @param initial The input passed to the transform.
         * @param ctx The accumulated context for the transform.
         */
        _this.object = function (def, directive, ctx) {
            // Create the object type.
            ctx.addObject(def);
            // Create the dynamodb table to hold the @model type
            // TODO: Handle types with more than a single "id" hash key
            var typeName = def.name.value;
            var tableLogicalID = graphql_transformer_common_2.ModelResourceIDs.ModelTableResourceID(typeName);
            var iamRoleLogicalID = graphql_transformer_common_2.ModelResourceIDs.ModelTableIAMRoleID(typeName);
            ctx.setResource(tableLogicalID, _this.resources.makeModelTable(typeName));
            ctx.setResource(iamRoleLogicalID, _this.resources.makeIAMRole(tableLogicalID));
            ctx.setResource(graphql_transformer_common_2.ModelResourceIDs.ModelTableDataSourceID(typeName), _this.resources.makeDynamoDBDataSource(tableLogicalID, iamRoleLogicalID));
            // Create the input types.
            var createInput = definitions_1.makeCreateInputObject(def);
            var updateInput = definitions_1.makeUpdateInputObject(def);
            var deleteInput = definitions_1.makeDeleteInputObject(def);
            ctx.addInput(createInput);
            ctx.addInput(updateInput);
            ctx.addInput(deleteInput);
            // Create the mutation & query extension
            var mutationType = graphql_transformer_common_1.blankObjectExtension('Mutation');
            var queryType = graphql_transformer_common_1.blankObjectExtension('Query');
            // Get any name overrides provided by the user. If an empty map it provided
            // then we do not generate those fields.
            var directiveArguments = _super.prototype.getDirectiveArgumentMap.call(_this, directive);
            var shouldMakeCreate = true;
            var shouldMakeUpdate = true;
            var shouldMakeDelete = true;
            var shouldMakeGet = true;
            // TODO: Re-enable this if needed but its redundant as of now.
            var shouldMakeQuery = false;
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
                ctx.setResource(graphql_transformer_common_2.ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName), createResolver);
                mutationType = graphql_transformer_common_1.extensionWithFields(mutationType, [graphql_transformer_common_1.makeField(createResolver.Properties.FieldName, [graphql_transformer_common_1.makeArg('input', graphql_transformer_common_1.makeNonNullType(graphql_transformer_common_1.makeNamedType(createInput.name.value)))], graphql_transformer_common_1.makeNamedType(def.name.value))]);
            }
            if (shouldMakeUpdate) {
                var updateResolver = _this.resources.makeUpdateResolver(def.name.value, updateFieldNameOverride);
                ctx.setResource(graphql_transformer_common_2.ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName), updateResolver);
                mutationType = graphql_transformer_common_1.extensionWithFields(mutationType, [graphql_transformer_common_1.makeField(updateResolver.Properties.FieldName, [graphql_transformer_common_1.makeArg('input', graphql_transformer_common_1.makeNonNullType(graphql_transformer_common_1.makeNamedType(updateInput.name.value)))], graphql_transformer_common_1.makeNamedType(def.name.value))]);
            }
            if (shouldMakeDelete) {
                var deleteResolver = _this.resources.makeDeleteResolver(def.name.value, deleteFieldNameOverride);
                ctx.setResource(graphql_transformer_common_2.ResolverResourceIDs.DynamoDBDeleteResolverResourceID(typeName), deleteResolver);
                mutationType = graphql_transformer_common_1.extensionWithFields(mutationType, [graphql_transformer_common_1.makeField(deleteResolver.Properties.FieldName, [graphql_transformer_common_1.makeArg('input', graphql_transformer_common_1.makeNonNullType(graphql_transformer_common_1.makeNamedType(deleteInput.name.value)))], graphql_transformer_common_1.makeNamedType(def.name.value))]);
            }
            ctx.addObjectExtension(mutationType);
            // Create query queries
            if (shouldMakeQuery) {
                _this.generateTableXConnectionType(ctx, def);
                var queryResolver = _this.resources.makeQueryResolver(def.name.value, queryFieldNameOverride);
                ctx.setResource(graphql_transformer_common_2.ResolverResourceIDs.DynamoDBQueryResolverResourceID(typeName), queryResolver);
                queryType = graphql_transformer_common_1.extensionWithFields(queryType, [graphql_transformer_common_1.makeField(queryResolver.Properties.FieldName, [
                        graphql_transformer_common_1.makeArg('filter', graphql_transformer_common_1.makeNamedType("Table" + def.name.value + "FilterInput")),
                        graphql_transformer_common_1.makeArg('sortDirection', graphql_transformer_common_1.makeNamedType('TableSortDirection')),
                        graphql_transformer_common_1.makeArg('limit', graphql_transformer_common_1.makeNamedType('Int')),
                        graphql_transformer_common_1.makeArg('nextToken', graphql_transformer_common_1.makeNamedType('String'))
                    ], graphql_transformer_common_1.makeNamedType("Table" + def.name.value + "Connection"))]);
                if (!_this.typeExist('TableSortDirection', ctx)) {
                    var tableSortDirection = definitions_1.makeTableSortDirectionEnumObject();
                    ctx.addEnum(tableSortDirection);
                }
                _this.generateFilterInputs(ctx, def);
            }
            // Create get queries
            if (shouldMakeGet) {
                var getResolver = _this.resources.makeGetResolver(def.name.value, getFieldNameOverride);
                ctx.setResource(graphql_transformer_common_2.ResolverResourceIDs.DynamoDBGetResolverResourceID(typeName), getResolver);
                queryType = graphql_transformer_common_1.extensionWithFields(queryType, [graphql_transformer_common_1.makeField(getResolver.Properties.FieldName, [graphql_transformer_common_1.makeArg('id', graphql_transformer_common_1.makeNonNullType(graphql_transformer_common_1.makeNamedType('ID')))], graphql_transformer_common_1.makeNamedType(def.name.value))]);
            }
            if (shouldMakeList) {
                _this.generateTableXConnectionType(ctx, def);
                // Create the list resolver
                var listResolver = _this.resources.makeListResolver(def.name.value, listFieldNameOverride);
                ctx.setResource(graphql_transformer_common_2.ResolverResourceIDs.DynamoDBListResolverResourceID(typeName), listResolver);
                _this.generateFilterInputs(ctx, def);
                // Extend the query type to include listX
                queryType = graphql_transformer_common_1.extensionWithFields(queryType, [graphql_transformer_common_1.makeField(listResolver.Properties.FieldName, [
                        graphql_transformer_common_1.makeArg('filter', graphql_transformer_common_1.makeNamedType("Table" + def.name.value + "FilterInput")),
                        graphql_transformer_common_1.makeArg('limit', graphql_transformer_common_1.makeNamedType('Int')),
                        graphql_transformer_common_1.makeArg('nextToken', graphql_transformer_common_1.makeNamedType('String'))
                    ], graphql_transformer_common_1.makeNamedType("Table" + def.name.value + "Connection"))]);
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
        var connectionType = graphql_transformer_common_1.blankObject(tableXConnectionName);
        ctx.addObject(connectionType);
        // Create TableXConnection type with items and nextToken
        var connectionTypeExtension = graphql_transformer_common_1.blankObjectExtension(tableXConnectionName);
        connectionTypeExtension = graphql_transformer_common_1.extensionWithFields(connectionTypeExtension, [graphql_transformer_common_1.makeField('items', [], graphql_transformer_common_1.makeListType(graphql_transformer_common_1.makeNamedType(def.name.value)))]);
        connectionTypeExtension = graphql_transformer_common_1.extensionWithFields(connectionTypeExtension, [graphql_transformer_common_1.makeField('nextToken', [], graphql_transformer_common_1.makeNamedType('String'))]);
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
}(graphql_transform_1.Transformer));
exports.AppSyncDynamoDBTransformer = AppSyncDynamoDBTransformer;
//# sourceMappingURL=AppSyncDynamoDBTransformer.js.map