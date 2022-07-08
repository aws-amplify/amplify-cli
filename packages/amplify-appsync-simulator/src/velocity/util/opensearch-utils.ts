/**
 * Utility class to convert the given params to opensearch query DSL
 */
class ElasticsearchUtils {
    private static readonly ONE: number = 1;
    private static readonly BOOL: string = "bool";
    private static readonly MUST: string = "must";
    private static readonly MUST_NOT: string = "must_not";
    private static readonly SHOULD: string = "should";
    private static readonly MATCH: string = "match";
    private static readonly MATCH_PHRASE: string = "match_phrase";
    private static readonly MATCH_PHRASE_PREFIX: string = "match_phrase_prefix";
    private static readonly MULTI_MATCH: string = "multi_match";
    private static readonly EXISTS: string = "exists";
    private static readonly WILDCARD: string = "wildcard";
    private static readonly REGEXP: string = "regexp";
    private static readonly RANGE: string = "range";
    private static readonly GT: string = "gt";
    private static readonly GTE: string = "gte";
    private static readonly LT: string = "lt";
    private static readonly LTE: string = "lte";
    private static readonly MINIMUM_SHOULD_MATCH: string = "minimum_should_match";
    private static readonly FIELD: string = "field";

    /**
     * Convert a field and a value into Elasticsearch "match" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toEqExpression(fieldName: string, value: any): any {
        if (!fieldName) {
            return null;
        }

        const updatedFieldName: string = ((typeof value) === "string") ? (fieldName + ".keyword") : fieldName;

        return this.toMatchExpression(updatedFieldName, value);
    }

    /**
     * Convert a field and a value into Elasticsearch "match_phrase" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toNeExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return this.toNotExpression(this.toEqExpression(fieldName, value));
    }

    /**
     * Convert a field and a value into Elasticsearch "match" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toMatchExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.MATCH]: {
                [fieldName]: value
            }
        };
    }

    /**
     * Convert a field and a value into Elasticsearch "match_phrase" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toMatchPhraseExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.MATCH_PHRASE]: {
                [fieldName]: value
            }
        };
    }

    /**
     * Convert a field and a value into Elasticsearch "match_phrase_prefix" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toMatchPhrasePrefixExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.MATCH_PHRASE_PREFIX]: {
                [fieldName]: value
            }
        };
    }

    /**
     * Convert a field and a value into Elasticsearch "multi_match" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toMultiMatchExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.MULTI_MATCH]: {
                [fieldName]: value
            }
        };
    }

    /**
     * Convert a field and a value into Elasticsearch "exists" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toExistsExpression(fieldName: string, value: boolean): any {

        if (!fieldName || (typeof value !== 'boolean')) {
            return null;
        }

        if (value) {
            return {
                [ElasticsearchUtils.EXISTS]: {
                    [ElasticsearchUtils.FIELD]: fieldName
                }
            };
        } else {
            return {
                [ElasticsearchUtils.BOOL]: {
                    [ElasticsearchUtils.MUST_NOT]: {
                        [ElasticsearchUtils.EXISTS]: {
                            [ElasticsearchUtils.FIELD]: fieldName
                        }
                    }
                }
            };
        }
    }

    /**
     * Convert a field and a value into Elasticsearch "wildcard" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toWildcardExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.WILDCARD]: {
                [fieldName]: value
            }
        }
    }

    /**
     * Convert a field and a value into Elasticsearch "regexp" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toRegularExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.REGEXP]: {
                [fieldName]: value
            }
        };
    }

    /**
     * Convert a field and a value into Elasticsearch "gt" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toGtExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.GT]: value
                }
            }
        };


    }

    /**
     * Convert a field and a value into Elasticsearch "gte" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toGteExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.GTE]: value
                }
            }
        };


    }

    /**
     * Convert a field and a value into Elasticsearch "lt" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toLTExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.LT]: value
                }
            }
        };
    }

    /**
     * Convert a field and a value into Elasticsearch "lte" expression.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param value
     *      The value in the expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toLTEExpression(fieldName: string, value: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.LTE]: value
                }
            }
        };
    }


    /**
     * Convert a field and a value into Elasticsearch "range" expression.
     *  This will result in an inclusive range search query.
     *
     * @param fieldName
     *      The operand that is indexed in Elasticsearch.
     * @param start
     *      The lower value in the range expression.
     * @param end
     *      The higher value in the range expression.
     * @return
     *      The converted Elasticsearch expression. Returns null if fieldName is invalid.
     */
    public toRangeExpression(fieldName: string, start: any, end: any): any {

        if (!fieldName) {
            return null;
        }

        return {
            [ElasticsearchUtils.RANGE]: {
                [fieldName]: {
                    [ElasticsearchUtils.GTE]: start,
                    [ElasticsearchUtils.LTE]: end
                }
            }
        };
    }

    /**
     * Convert a field and a value into Elasticsearch "AND" expression.
     *
     * @param filterClauses
     *      A list of filter clauses to be ANDed in Elasticsearch expression.
     * @return
     *      The converted Elasticsearch AND expression. Returns null if filterClauses is invalid.
     */
    public toAndExpression(filterClauses: any[]): any {
        if (!filterClauses || filterClauses.length == 0) {
            return null;
        }

        let andExpression: any = {
            [ElasticsearchUtils.BOOL]: {
                [ElasticsearchUtils.MUST]: filterClauses
            }
        };

        return andExpression;
    }

    /**
     * Convert a field and a value into Elasticsearch "OR" expression.
     *
     * @param filterClauses
     *      A list of filter clauses to be ORed in Elasticsearch expression.
     * @return
     *      The converted Elasticsearch OR expression. Returns null if filterClauses is invalid.
     */
    public toOrExpression(filterClauses: any[]): any {
        if (!filterClauses || filterClauses.length == 0) {
            return null;
        }

        let andExpression: any = {
            [ElasticsearchUtils.BOOL]: {
                [ElasticsearchUtils.SHOULD]: filterClauses,
                [ElasticsearchUtils.MINIMUM_SHOULD_MATCH]: ElasticsearchUtils.ONE
            }
        };

        return andExpression;
    }

    /**
     * Convert a field and a value into Elasticsearch "NOT" expression.
     *
     * @param expression
     *      A filter clause to be NOTed in Elasticsearch expression.
     * @return
     *      The converted Elasticsearch NOT expression. Returns null if expression is invalid.
     */
    public toNotExpression(expression: any): any {
        if (!expression) {
            return null;
        }

        let andExpression: any = {
            [ElasticsearchUtils.BOOL]: {
                [ElasticsearchUtils.MUST_NOT]: expression
            }
        };

        return andExpression;
    }

}

class ElasticsearchHelper {
    private static readonly ES_UTILS: ElasticsearchUtils = new ElasticsearchUtils();

    private static readonly ERROR_FORMAT: string = "Could not construct an Elasticsearch Query DSL from {0} and {1}";


    /**
     * This method is used by the ModelTransformUtils.
     *
     * For Example, the following filter parameter:
     *
     * filter: {
     *     title: {
     *         eq: "hihihi",
     *         wildcard: "h*i"
     *     },
     *     upvotes: {
     *         gt: 5
     *     }
     * }
     *
     * will generate the following Elasticsearch Query DSL:
     *
     * {
     *     "bool":{
     *     "must":[
     *       {
     *         "range":{
                 "upvotes":{
     *             "gt":5
     *           }
     *         }
     *       },
     *       {
     *         "bool":{
     *           "must":[
     *             {
     *               "term":{
     *                 "title":"hihihi"
     *               }
     *             },
     *             {
     *               "wildcard":{
     *                 "title":"h*i"
     *               }
     *             }
     *           ]
     *         }
     *       }
     *     ]
     *   }
     * }
     *
     * The default Operator is assumed to be `AND`.
     *
     * This will accept a FilterInput object, and return an Elasticsearch Query DSL Expression.
     * This FilterInput object is defined by the appsync-model-transform code,
     *  so this method is opinionated to follow this pattern.
     *
     * @param filterInput
     *      The FilterInput object.
     * @return
     *      The Elasticsearch Query DSL
     * 
     */
    public  getQueryDSL(filterInput: any) : any {
        let results:any[] = this.getQueryDSLRecursive(filterInput);

        return this.getOrAndSubexpressions(results)
    }

    public getScalarQueryDSL(fieldName: string, conditions: any): any[] {
        let results: any[] = [];
        let keys: string[] = Object.keys(conditions);
        
        keys.forEach((key: string) => {
            const condition: string = key;
            const value: any = conditions[key];

            if ("range" === condition) {
                if(value.length && value.length < 1) {
                    return
                }

                results.push(ElasticsearchHelper.ES_UTILS.toRangeExpression(fieldName, value[0], value[1]));
                return;
            }

            switch (condition) {
                case "eq":
                    results.push(ElasticsearchHelper.ES_UTILS.toEqExpression(fieldName, value));
                    break;
                case "ne":
                    results.push(ElasticsearchHelper.ES_UTILS.toNeExpression(fieldName, value));
                    break;
                case "match":
                    results.push(ElasticsearchHelper.ES_UTILS.toMatchExpression(fieldName, value));
                    break;
                case "matchPhrase":
                    results.push(ElasticsearchHelper.ES_UTILS.toMatchPhraseExpression(fieldName, value));
                    break;
                case "matchPhrasePrefix":
                    results.push(ElasticsearchHelper.ES_UTILS.toMatchPhrasePrefixExpression(fieldName, value));
                    break;
                case "multiMatch":
                    results.push(ElasticsearchHelper.ES_UTILS.toMultiMatchExpression(fieldName, value));
                    break;
                case "exists":
                    results.push(ElasticsearchHelper.ES_UTILS.toExistsExpression(fieldName, value));
                    break;
                case "wildcard":
                    results.push(ElasticsearchHelper.ES_UTILS.toWildcardExpression(fieldName, value));
                    break;
                case "regexp":
                    results.push(ElasticsearchHelper.ES_UTILS.toRegularExpression(fieldName, value));
                    break;
                case "gt":
                    results.push(ElasticsearchHelper.ES_UTILS.toGtExpression(fieldName, value));
                    break;
                case "gte":
                    results.push(ElasticsearchHelper.ES_UTILS.toGteExpression(fieldName, value));
                    break;
                case "lt":
                    results.push(ElasticsearchHelper.ES_UTILS.toLTExpression(fieldName, value));
                    break;
                case "lte":
                    results.push(ElasticsearchHelper.ES_UTILS.toLTEExpression(fieldName, value));
                    break;
                default:
                    throw new Error(this.format(ElasticsearchHelper.ERROR_FORMAT, [condition, value]));
            }
        });

        return results;
    }

    private getQueryDSLRecursive(filterInputFields: any): any[] {
        let results: any[] = [];
        let keys: string[] = Object.keys(filterInputFields);

        keys.forEach((key: string) => {
            const values: any = filterInputFields[key];
                if (["and", "or"].includes(key.toLowerCase())) {
                    const subexpressions: any[] = [];

                    values.forEach((value: any) => {
                        let siblingChildExpressions: any[] = this.getQueryDSLRecursive(value);
                        subexpressions.push(this.getOrAndSubexpressions(siblingChildExpressions));
                    });

                    if ("and" === (key.toLowerCase())) {
                        results.push(ElasticsearchHelper.ES_UTILS.toAndExpression(subexpressions));
                    } else {
                        results.push(ElasticsearchHelper.ES_UTILS.toOrExpression(subexpressions));
                    }

                } else if ("not" === (key.toLowerCase())) {

                    let combinedDSLQuery: any[] = this.getQueryDSLRecursive(values);
                    results.push(ElasticsearchHelper.ES_UTILS.toNotExpression(this.getOrAndSubexpressions(combinedDSLQuery)));

                } else {
                    const combinedDSLQuery: any[] = this.getScalarQueryDSL(key, values);
                    results.push(this.getOrAndSubexpressions(combinedDSLQuery));
                }
        });
        return results;
    }

    private getOrAndSubexpressions(subexpressions: any[]): any {
        const size = subexpressions.length;
        if (size == 1) {
            return subexpressions[0];
        } else {
            return ElasticsearchHelper.ES_UTILS.toAndExpression(subexpressions);
        }
    }

    private format(format: string, args: any[]): string {
        if (!args) {
            return "";
        }

        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match;
        });
    }
}

export default ElasticsearchHelper;