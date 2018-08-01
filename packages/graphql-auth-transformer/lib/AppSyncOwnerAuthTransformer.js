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
/**
 * Implements the AppSyncOwnerAuthTransformer.
 *
 * Usage:
 *
 * type Post @ownerAuth {
 *   id: ID!
 *   title: String
 *   createdAt: String
 *   updatedAt: String
 * }
 *
 * Impact:
 *
 * getPost - In the response mapping template we check the "owner" field === $ctx.identity.username.
 * createPost - We automatically insert a "owner" field to attribute values where "owner" === $ctx.identity.username.
 * updatePost - Expose "owner" field in input/output and would set conditional update expression to look for owner.
 * deletePost - Conditional expression checking that the owner === $ctx.identity.username
 *
 * In this example, we would also inject an "owner" field into the type and input type.
 *
 * Customers may override what operations are protected via the queries & mutations arguments.
 */
var AppSyncOwnerAuthTransformer = /** @class */ (function (_super) {
    __extends(AppSyncOwnerAuthTransformer, _super);
    function AppSyncOwnerAuthTransformer() {
        var _this = _super.call(this, 'AppSyncOwnerAuthTransformer', "directive @ownerAuth(field: String = \"owner\", queries: [TableQuery], mutations: [TableMutation]) on OBJECT", "\n                enum TableQuery { get }\n                enum TableMutation { create update delete }\n            ") || this;
        _this.before = function (ctx) {
            var template = _this.resources.initTemplate();
            ctx.mergeResources(template.Resources);
            ctx.mergeParameters(template.Parameters);
            ctx.mergeOutputs(template.Outputs);
        };
        /**
         * Updates the GraphQL API record to use user pool auth.
         */
        _this.updateAPIForUserPools = function (ctx) {
        };
        _this.object = function (def, directive, ctx) { };
        _this.resources = new resources_1.ResourceFactory();
        return _this;
    }
    return AppSyncOwnerAuthTransformer;
}(amplify_graphql_transform_1.Transformer));
exports.AppSyncOwnerAuthTransformer = AppSyncOwnerAuthTransformer;
//# sourceMappingURL=AppSyncOwnerAuthTransformer.js.map