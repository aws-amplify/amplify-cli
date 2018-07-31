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
var resources_1 = require("./resources");
var definitions_1 = require("./definitions");
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
/**
 * Handles the @searchable directive on OBJECT types.
 */
var AppSyncSearchableTransformer = /** @class */ (function (_super) {
    __extends(AppSyncSearchableTransformer, _super);
    function AppSyncSearchableTransformer() {
        var _this = _super.call(this, "AppSyncSearchableTransformer", "directive @searchable(queries: ElasticsearchSearchMap) on OBJECT", "\n                input ElasticsearchSearchMap { search: String }\n            ") || this;
        _this.before = function (ctx) {
            var template = _this.resources.initTemplate();
            ctx.mergeResources(template.Resources);
            ctx.mergeParameters(template.Parameters);
        };
        /**
         * Given the initial input and context manipulate the context to handle this object directive.
         * @param initial The input passed to the transform.
         * @param ctx The accumulated context for the transform.
         */
        _this.object = function (def, directive, ctx) {
            var directiveArguments = _super.prototype.getDirectiveArgumentMap.call(_this, directive);
            var shouldMakeSearch = true;
            var searchFieldNameOverride = undefined;
            // Figure out which queries to make and if they have name overrides.
            if (directiveArguments.queries) {
                if (!directiveArguments.queries.search) {
                    shouldMakeSearch = false;
                }
                else {
                    searchFieldNameOverride = directiveArguments.queries.search;
                }
            }
            //SearchablePostSortableFields
            var queryType = amplify_graphql_transformer_common_1.blankObjectExtension('Query');
            // Create listX
            if (shouldMakeSearch) {
                _this.generateSearchableInputs(ctx, def);
                _this.generateSearchableXConnectionType(ctx, def);
                var searchResolver = _this.resources.makeSearchResolver(def.name.value, searchFieldNameOverride);
                ctx.setResource("Search" + def.name.value + "Resolver", searchResolver);
                queryType = amplify_graphql_transformer_common_1.extensionWithFields(queryType, [
                    amplify_graphql_transformer_common_1.makeField(searchResolver.Properties.FieldName, [
                        amplify_graphql_transformer_common_1.makeArg('filter', amplify_graphql_transformer_common_1.makeNamedType("Searchable" + def.name.value + "FilterInput")),
                        amplify_graphql_transformer_common_1.makeArg('sort', amplify_graphql_transformer_common_1.makeNamedType("Searchable" + def.name.value + "SortInput")),
                        amplify_graphql_transformer_common_1.makeArg('limit', amplify_graphql_transformer_common_1.makeNamedType('Int')),
                        amplify_graphql_transformer_common_1.makeArg('nextToken', amplify_graphql_transformer_common_1.makeNamedType('String'))
                    ], amplify_graphql_transformer_common_1.makeNamedType("Searchable" + def.name.value + "Connection"))
                ]);
            }
            ctx.addObjectExtension(queryType);
        };
        _this.resources = new resources_1.ResourceFactory();
        return _this;
    }
    AppSyncSearchableTransformer.prototype.generateSearchableXConnectionType = function (ctx, def) {
        var searchableXConnectionName = "Searchable" + def.name.value + "Connection";
        if (this.typeExist(searchableXConnectionName, ctx)) {
            return;
        }
        // Create the TableXConnection
        var connectionType = amplify_graphql_transformer_common_1.blankObject(searchableXConnectionName);
        ctx.addObject(connectionType);
        // Create TableXConnection type with items and nextToken
        var connectionTypeExtension = amplify_graphql_transformer_common_1.blankObjectExtension(searchableXConnectionName);
        connectionTypeExtension = amplify_graphql_transformer_common_1.extensionWithFields(connectionTypeExtension, [amplify_graphql_transformer_common_1.makeField('items', [], amplify_graphql_transformer_common_1.makeListType(amplify_graphql_transformer_common_1.makeNamedType(def.name.value)))]);
        connectionTypeExtension = amplify_graphql_transformer_common_1.extensionWithFields(connectionTypeExtension, [amplify_graphql_transformer_common_1.makeField('nextToken', [], amplify_graphql_transformer_common_1.makeNamedType('String'))]);
        ctx.addObjectExtension(connectionTypeExtension);
    };
    AppSyncSearchableTransformer.prototype.typeExist = function (type, ctx) {
        return Boolean(type in ctx.nodeMap);
    };
    AppSyncSearchableTransformer.prototype.generateSearchableInputs = function (ctx, def) {
        // Create the Scalar filter inputs
        if (!this.typeExist('SearchableStringFilterInput', ctx)) {
            var searchableStringFilterInput = definitions_1.makeSearchableScalarInputObject('String');
            ctx.addInput(searchableStringFilterInput);
        }
        if (!this.typeExist('SearchableIDFilterInput', ctx)) {
            var searchableIDFilterInput = definitions_1.makeSearchableScalarInputObject('ID');
            ctx.addInput(searchableIDFilterInput);
        }
        if (!this.typeExist('SearchableIntFilterInput', ctx)) {
            var searchableIntFilterInput = definitions_1.makeSearchableScalarInputObject('Int');
            ctx.addInput(searchableIntFilterInput);
        }
        if (!this.typeExist('SearchableFloatFilterInput', ctx)) {
            var searchableFloatFilterInput = definitions_1.makeSearchableScalarInputObject('Float');
            ctx.addInput(searchableFloatFilterInput);
        }
        if (!this.typeExist('SearchableBooleanFilterInput', ctx)) {
            var searchableBooleanFilterInput = definitions_1.makeSearchableScalarInputObject('Boolean');
            ctx.addInput(searchableBooleanFilterInput);
        }
        if (!this.typeExist("Searchable" + def.name.value + "FilterInput", ctx)) {
            var searchableXQueryFilterInput = definitions_1.makeSearchableXFilterInputObject(def);
            ctx.addInput(searchableXQueryFilterInput);
        }
        if (!this.typeExist('SearchableSortDirection', ctx)) {
            var searchableSortDirection = definitions_1.makeSearchableSortDirectionEnumObject();
            ctx.addEnum(searchableSortDirection);
        }
        if (!this.typeExist("Searchable" + def.name.value + "SortableFields", ctx)) {
            var searchableXSortableFieldsDirection = definitions_1.makeSearchableXSortableFieldsEnumObject(def);
            ctx.addEnum(searchableXSortableFieldsDirection);
        }
        if (!this.typeExist("Searchable" + def.name.value + "SortInput", ctx)) {
            var searchableXSortableInputDirection = definitions_1.makeSearchableXSortInputObject(def);
            ctx.addInput(searchableXSortableInputDirection);
        }
    };
    return AppSyncSearchableTransformer;
}(amplify_graphql_transform_1.Transformer));
exports.AppSyncSearchableTransformer = AppSyncSearchableTransformer;
//# sourceMappingURL=AppSyncSearchableTransformer.js.map