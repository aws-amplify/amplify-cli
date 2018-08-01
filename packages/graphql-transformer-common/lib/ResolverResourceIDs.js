"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResolverResourceIDs = /** @class */ (function () {
    function ResolverResourceIDs() {
    }
    ResolverResourceIDs.DynamoDBCreateResolverResourceID = function (typeName) {
        return "Create" + typeName + "Resolver";
    };
    ResolverResourceIDs.DynamoDBUpdateResolverResourceID = function (typeName) {
        return "Update" + typeName + "Resolver";
    };
    ResolverResourceIDs.DynamoDBDeleteResolverResourceID = function (typeName) {
        return "Delete" + typeName + "Resolver";
    };
    ResolverResourceIDs.DynamoDBQueryResolverResourceID = function (typeName) {
        return "Query" + typeName + "Resolver";
    };
    ResolverResourceIDs.DynamoDBGetResolverResourceID = function (typeName) {
        return "Get" + typeName + "Resolver";
    };
    ResolverResourceIDs.DynamoDBListResolverResourceID = function (typeName) {
        return "List" + typeName + "Resolver";
    };
    ResolverResourceIDs.ElasticsearchSearchResolverResourceID = function (typeName) {
        return "Search" + typeName + "Resolver";
    };
    return ResolverResourceIDs;
}());
exports.ResolverResourceIDs = ResolverResourceIDs;
//# sourceMappingURL=ResolverResourceIDs.js.map