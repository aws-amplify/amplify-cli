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
var AppSyncSearchTransformer = /** @class */ (function (_super) {
    __extends(AppSyncSearchTransformer, _super);
    function AppSyncSearchTransformer() {
        var _this = _super.call(this, 'AppSyncSearchTransformer', "directive @search on FIELD") || this;
        _this.resources = new resources_1.ResourceFactory();
        return _this;
    }
    AppSyncSearchTransformer.prototype.before = function (ctx) {
        var template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources);
        ctx.mergeParameters(template.Parameters);
    };
    /**
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    AppSyncSearchTransformer.prototype.object = function (def, directive, ctx) {
        // Create the connection object type.
        var connection = definitions_1.makeConnection(definitions_1.makeNamedType(def.name.value));
        ctx.addObject(connection);
        var queryType = definitions_1.blankObjectExtension('Query');
        // Todo: The @search directive in the current setup should really be a field transform.
        // This object transform should create the search filter & sort inputs as well as the
        // updated searchX query field and associated resolver
        var isSearchable = function (field) { return field.directives.find(function (dir) { return dir.name.value === 'search'; }); };
        var pluckName = function (field) { return field.name.value; };
        var searchableFields = (def.fields || []).filter(isSearchable).map(pluckName);
        var searchResolver = this.resources.makeSearchResolver(def.name.value, searchableFields);
        ctx.setResource("Search" + def.name.value + "Resolver", searchResolver);
        queryType.fields.push(definitions_1.makeField(searchResolver.Properties.FieldName, [
            definitions_1.makeArg('query', definitions_1.makeNonNullType(definitions_1.makeNamedType('String'))),
            definitions_1.makeArg('first', definitions_1.makeNamedType('Int')),
            definitions_1.makeArg('after', definitions_1.makeNamedType('String'))
        ], definitions_1.makeNamedType(connection.name.value)));
        ctx.addObjectExtension(queryType);
    };
    return AppSyncSearchTransformer;
}(graphql_transform_1.Transformer));
exports.AppSyncSearchTransformer = AppSyncSearchTransformer;
//# sourceMappingURL=AppSyncSearchTransformer.js.map