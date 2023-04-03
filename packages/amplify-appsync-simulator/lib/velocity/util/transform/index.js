"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformUtils = void 0;
const dynamodb_filter_1 = require("./dynamodb-filter");
const elasticsearch_helper_1 = __importDefault(require("../elasticsearch-helper"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
exports.transformUtils = {
    toDynamoDBConditionExpression: (condition) => {
        const result = (0, dynamodb_filter_1.generateFilterExpression)(condition.toJSON());
        return JSON.stringify({
            expression: result.expressions.join(' ').trim(),
            expressionNames: result.expressionNames,
        });
    },
    toDynamoDBFilterExpression: (filter) => {
        const result = (0, dynamodb_filter_1.generateFilterExpression)(filter.toJSON());
        return JSON.stringify({
            expression: result.expressions.join(' ').trim(),
            expressionNames: result.expressionNames,
            expressionValues: result.expressionValues,
        });
    },
    toElasticsearchQueryDSL: (filter) => {
        const elasticsearchHelper = new elasticsearch_helper_1.default();
        if (!filter) {
            return null;
        }
        try {
            const queryDSL = elasticsearchHelper.getQueryDSL(filter.toJSON());
            return JSON.stringify(queryDSL);
        }
        catch (err) {
            amplify_prompts_1.printer.error('Error when constructing the Elasticsearch Query DSL using the model transform utils. {}');
            return null;
        }
    },
};
//# sourceMappingURL=index.js.map