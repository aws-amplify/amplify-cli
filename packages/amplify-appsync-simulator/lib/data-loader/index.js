"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDataLoader = exports.addDataLoader = exports.getDataLoader = void 0;
const dynamo_db_1 = require("./dynamo-db");
const none_1 = require("./none");
const lambda_1 = require("./lambda");
const opensearch_1 = require("./opensearch");
const DATA_LOADER_MAP = new Map();
function getDataLoader(sourceType) {
    if (DATA_LOADER_MAP.has(sourceType)) {
        return DATA_LOADER_MAP.get(sourceType);
    }
    throw new Error(`Unsupported data source type ${sourceType}`);
}
exports.getDataLoader = getDataLoader;
function addDataLoader(sourceType, loader) {
    if (DATA_LOADER_MAP.has(sourceType)) {
        throw new Error(`Data loader for source ${sourceType} is already registered`);
    }
    DATA_LOADER_MAP.set(sourceType, loader);
}
exports.addDataLoader = addDataLoader;
function removeDataLoader(sourceType) {
    return DATA_LOADER_MAP.delete(sourceType);
}
exports.removeDataLoader = removeDataLoader;
addDataLoader("AMAZON_DYNAMODB", dynamo_db_1.DynamoDBDataLoader);
addDataLoader("NONE", none_1.NoneDataLoader);
addDataLoader("AWS_LAMBDA", lambda_1.LambdaDataLoader);
addDataLoader("AMAZON_ELASTICSEARCH", opensearch_1.OpenSearchDataLoader);
//# sourceMappingURL=index.js.map