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
var graphql_1 = require("graphql");
var resources_1 = require("./resources");
/**
 * Handles the @searchable directive on OBJECT types.
 */
var AppSyncSearchableTransformer = /** @class */ (function (_super) {
    __extends(AppSyncSearchableTransformer, _super);
    function AppSyncSearchableTransformer() {
        var _this = _super.call(this, 'AppSyncSearchableTransformer', graphql_1.parse("directive @searchable on OBJECT").definitions[0]) || this;
        _this.resources = new resources_1.ResourceFactory();
        return _this;
    }
    AppSyncSearchableTransformer.prototype.before = function (ctx) {
        // Any one time setup   
    };
    /**
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    AppSyncSearchableTransformer.prototype.object = function (def, directive, ctx) {
        // Transformer code here
    };
    return AppSyncSearchableTransformer;
}(graphql_transform_1.Transformer));
exports.AppSyncSearchableTransformer = AppSyncSearchableTransformer;
//# sourceMappingURL=AppSyncSearchableTransformer.js.map