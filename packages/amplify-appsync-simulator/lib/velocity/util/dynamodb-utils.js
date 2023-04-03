"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamodbUtils = void 0;
const dynamodb_1 = require("aws-sdk/clients/dynamodb");
const set_1 = require("aws-sdk/lib/dynamodb/set");
const to_json_1 = require("../value-mapper/to-json");
exports.dynamodbUtils = {
    toDynamoDB(value) {
        return dynamodb_1.Converter.input((0, to_json_1.toJSON)(value));
    },
    $toSet(values, fn = (value) => value) {
        return this.toDynamoDB(new set_1.DynamoDBSet([].concat(values).map((value) => fn(value))));
    },
    toDynamoDBJson(value) {
        return JSON.stringify(this.toDynamoDB(value));
    },
    toString(value) {
        return this.toDynamoDB(String(value));
    },
    toStringJson(value) {
        return this.toDynamoDBJson(value);
    },
    toStringSet(value) {
        return this.$toSet(value, String);
    },
    toStringSetJson(value) {
        return JSON.stringify(this.toStringSet(value));
    },
    toNumber(value) {
        return this.toDynamoDB(Number(value));
    },
    toNumberJson(value) {
        return JSON.stringify(this.toNumber(value));
    },
    toNumberSet(value) {
        return this.$toSet(value, Number);
    },
    toNumberSetJson(value) {
        return JSON.stringify(this.toNumberSet(value));
    },
    toBinary(value) {
        return { B: (0, to_json_1.toJSON)(value) };
    },
    toBinaryJson(value) {
        return JSON.stringify(this.toBinary(value));
    },
    toBinarySet(value) {
        return { BS: [].concat(value) };
    },
    toBinarySetJson(value) {
        return JSON.stringify(this.toBinarySet(value));
    },
    toBoolean(value) {
        return { BOOL: value };
    },
    toBooleanJson(value) {
        return JSON.stringify(this.toBoolean(value));
    },
    toNull() {
        return { NULL: null };
    },
    toNullJson() {
        return JSON.stringify(this.toNull());
    },
    toList(value) {
        return this.toDynamoDB(value);
    },
    toListJson(value) {
        return JSON.stringify(this.toList(value));
    },
    toMap(value) {
        return this.toDynamoDB((0, to_json_1.toJSON)(value));
    },
    toMapJson(value) {
        return JSON.stringify(this.toMap(value));
    },
    toMapValues(values) {
        return Object.entries((0, to_json_1.toJSON)(values)).reduce((sum, [key, value]) => ({
            ...sum,
            [key]: this.toDynamoDB(value),
        }), {});
    },
    toMapValuesJson(values) {
        return JSON.stringify(this.toMapValues(values));
    },
    toS3ObjectJson() {
        throw new Error('not implemented');
    },
    toS3Object() {
        throw new Error('not implemented');
    },
    fromS3ObjectJson() {
        throw new Error('not implemented');
    },
};
//# sourceMappingURL=dynamodb-utils.js.map