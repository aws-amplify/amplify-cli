"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_utils_1 = __importDefault(require("./elasticsearch-utils"));
class ElasticsearchHelper {
    getQueryDSL(filterInput) {
        const results = this.getQueryDSLRecursive(filterInput);
        return this.getOrAndSubexpressions(results);
    }
    getScalarQueryDSL(fieldName, conditions) {
        const results = [];
        const keys = Object.keys(conditions);
        keys.forEach((key) => {
            const condition = key;
            const value = conditions[key];
            if ('range' === condition) {
                if (value.length && value.length < 1) {
                    return;
                }
                results.push(ElasticsearchHelper.ES_UTILS.toRangeExpression(fieldName, value[0], value[1]));
                return;
            }
            switch (condition) {
                case 'eq':
                    results.push(ElasticsearchHelper.ES_UTILS.toEqExpression(fieldName, value));
                    break;
                case 'ne':
                    results.push(ElasticsearchHelper.ES_UTILS.toNeExpression(fieldName, value));
                    break;
                case 'match':
                    results.push(ElasticsearchHelper.ES_UTILS.toMatchExpression(fieldName, value));
                    break;
                case 'matchPhrase':
                    results.push(ElasticsearchHelper.ES_UTILS.toMatchPhraseExpression(fieldName, value));
                    break;
                case 'matchPhrasePrefix':
                    results.push(ElasticsearchHelper.ES_UTILS.toMatchPhrasePrefixExpression(fieldName, value));
                    break;
                case 'multiMatch':
                    results.push(ElasticsearchHelper.ES_UTILS.toMultiMatchExpression(fieldName, value));
                    break;
                case 'exists':
                    results.push(ElasticsearchHelper.ES_UTILS.toExistsExpression(fieldName, value));
                    break;
                case 'wildcard':
                    results.push(ElasticsearchHelper.ES_UTILS.toWildcardExpression(fieldName, value));
                    break;
                case 'regexp':
                    results.push(ElasticsearchHelper.ES_UTILS.toRegularExpression(fieldName, value));
                    break;
                case 'gt':
                    results.push(ElasticsearchHelper.ES_UTILS.toGtExpression(fieldName, value));
                    break;
                case 'gte':
                    results.push(ElasticsearchHelper.ES_UTILS.toGteExpression(fieldName, value));
                    break;
                case 'lt':
                    results.push(ElasticsearchHelper.ES_UTILS.toLTExpression(fieldName, value));
                    break;
                case 'lte':
                    results.push(ElasticsearchHelper.ES_UTILS.toLTEExpression(fieldName, value));
                    break;
                default:
                    throw new Error(this.format(ElasticsearchHelper.ERROR_FORMAT, [condition, value]));
            }
        });
        return results;
    }
    getQueryDSLRecursive(filterInputFields) {
        const results = [];
        const keys = Object.keys(filterInputFields);
        keys.forEach((key) => {
            const values = filterInputFields[key];
            if (['and', 'or'].includes(key.toLowerCase())) {
                const subexpressions = [];
                values.forEach((value) => {
                    const siblingChildExpressions = this.getQueryDSLRecursive(value);
                    subexpressions.push(this.getOrAndSubexpressions(siblingChildExpressions));
                });
                if ('and' === key.toLowerCase()) {
                    results.push(ElasticsearchHelper.ES_UTILS.toAndExpression(subexpressions));
                }
                else {
                    results.push(ElasticsearchHelper.ES_UTILS.toOrExpression(subexpressions));
                }
            }
            else if ('not' === key.toLowerCase()) {
                const combinedDSLQuery = this.getQueryDSLRecursive(values);
                results.push(ElasticsearchHelper.ES_UTILS.toNotExpression(this.getOrAndSubexpressions(combinedDSLQuery)));
            }
            else {
                const combinedDSLQuery = this.getScalarQueryDSL(key, values);
                results.push(this.getOrAndSubexpressions(combinedDSLQuery));
            }
        });
        return results;
    }
    getOrAndSubexpressions(subexpressions) {
        const size = subexpressions.length;
        if (size == 1) {
            return subexpressions[0];
        }
        else {
            return ElasticsearchHelper.ES_UTILS.toAndExpression(subexpressions);
        }
    }
    format(format, args) {
        if (!args) {
            return '';
        }
        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    }
}
ElasticsearchHelper.ES_UTILS = new elasticsearch_utils_1.default();
ElasticsearchHelper.ERROR_FORMAT = 'Could not construct an Elasticsearch Query DSL from {0} and {1}';
exports.default = ElasticsearchHelper;
//# sourceMappingURL=elasticsearch-helper.js.map