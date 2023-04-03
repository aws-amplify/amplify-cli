"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLOperation = exports.CRUDOperation = exports.topLevelCommentSuffix = exports.topLevelCommentPrefix = exports.envVarPrintoutPrefix = exports.categoryName = void 0;
exports.categoryName = 'function';
exports.envVarPrintoutPrefix = '\nYou can access the following resource attributes as environment variables from your Lambda function\n\t';
const topLevelCommentBlockTitle = 'Amplify Params - DO NOT EDIT';
exports.topLevelCommentPrefix = `/* ${topLevelCommentBlockTitle}\n\t`;
exports.topLevelCommentSuffix = `\n${topLevelCommentBlockTitle} */`;
var CRUDOperation;
(function (CRUDOperation) {
    CRUDOperation["CREATE"] = "create";
    CRUDOperation["READ"] = "read";
    CRUDOperation["UPDATE"] = "update";
    CRUDOperation["DELETE"] = "delete";
})(CRUDOperation = exports.CRUDOperation || (exports.CRUDOperation = {}));
var GraphQLOperation;
(function (GraphQLOperation) {
    GraphQLOperation["QUERY"] = "Query";
    GraphQLOperation["MUTATION"] = "Mutation";
    GraphQLOperation["SUBSCRIPTION"] = "Subscription";
})(GraphQLOperation = exports.GraphQLOperation || (exports.GraphQLOperation = {}));
//# sourceMappingURL=constants.js.map