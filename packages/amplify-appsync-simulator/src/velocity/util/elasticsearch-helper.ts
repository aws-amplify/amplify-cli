import ElasticsearchUtils from './elasticsearch-utils';

class ElasticsearchHelper {
  private static readonly ES_UTILS: ElasticsearchUtils = new ElasticsearchUtils();

  private static readonly ERROR_FORMAT: string = 'Could not construct an Elasticsearch Query DSL from {0} and {1}';

  // eslint-disable-next-line spellcheck/spell-checker
  /**
   * This method is used by the ModelTransformUtils.
   *
   * For Example, the following filter parameter:
   *
   * filter: {
   *   title: {
   *     eq: "hihihi",
   *     wildcard: "h*i"
   *   },
   *   upvotes: {
   *     gt: 5
   *   }
   * }
   *
   * will generate the following Elasticsearch Query DSL:
   *
   * {
   *   "bool":{
   *   "must":[
   *     {
   *     "range":{
         "upvotes":{
   *       "gt":5
   *       }
   *     }
   *     },
   *     {
   *     "bool":{
   *       "must":[
   *       {
   *         "term":{
   *         "title":"hihihi"
   *         }
   *       },
   *       {
   *         "wildcard":{
   *         "title":"h*i"
   *         }
   *       }
   *       ]
   *     }
   *     }
   *   ]
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
   *    The FilterInput object.
   * @return
   *    The Elasticsearch Query DSL
   * 
   */
  public getQueryDSL(filterInput: any): any {
    const results: any[] = this.getQueryDSLRecursive(filterInput);

    return this.getOrAndSubexpressions(results);
  }

  public getScalarQueryDSL(fieldName: string, conditions: any): any[] {
    const results: any[] = [];
    const keys: string[] = Object.keys(conditions);

    keys.forEach((key: string) => {
      const condition: string = key;
      const value: any = conditions[key];

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

  private getQueryDSLRecursive(filterInputFields: any): any[] {
    const results: any[] = [];
    const keys: string[] = Object.keys(filterInputFields);

    keys.forEach((key: string) => {
      const values: any = filterInputFields[key];
      if (['and', 'or'].includes(key.toLowerCase())) {
        const subexpressions: any[] = [];

        values.forEach((value: any) => {
          const siblingChildExpressions: any[] = this.getQueryDSLRecursive(value);
          subexpressions.push(this.getOrAndSubexpressions(siblingChildExpressions));
        });

        if ('and' === key.toLowerCase()) {
          results.push(ElasticsearchHelper.ES_UTILS.toAndExpression(subexpressions));
        } else {
          results.push(ElasticsearchHelper.ES_UTILS.toOrExpression(subexpressions));
        }
      } else if ('not' === key.toLowerCase()) {
        const combinedDSLQuery: any[] = this.getQueryDSLRecursive(values);
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
      return '';
    }

    return format.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  }
}

export default ElasticsearchHelper;
