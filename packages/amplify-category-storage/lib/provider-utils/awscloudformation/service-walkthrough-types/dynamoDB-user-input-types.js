"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldType = exports.DynamoDBImmutableFields = void 0;
var DynamoDBImmutableFields;
(function (DynamoDBImmutableFields) {
    DynamoDBImmutableFields["resourceName"] = "resourceName";
    DynamoDBImmutableFields["tableName"] = "tableName";
    DynamoDBImmutableFields["partitionKey"] = "partitionKey";
    DynamoDBImmutableFields["sortKey"] = "sortKey";
})(DynamoDBImmutableFields = exports.DynamoDBImmutableFields || (exports.DynamoDBImmutableFields = {}));
var FieldType;
(function (FieldType) {
    FieldType["string"] = "string";
    FieldType["number"] = "number";
    FieldType["binary"] = "binary";
    FieldType["boolean"] = "boolean";
    FieldType["list"] = "list";
    FieldType["map"] = "map";
    FieldType["null"] = "null";
    FieldType["stringSet"] = "string-set";
    FieldType["numberSet"] = "number-set";
    FieldType["binarySet"] = "binary-set";
})(FieldType = exports.FieldType || (exports.FieldType = {}));
//# sourceMappingURL=dynamoDB-user-input-types.js.map