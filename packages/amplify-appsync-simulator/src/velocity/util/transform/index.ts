import { generateFilterExpression } from './dynamodb-filter';
import ElasticsearchHelper from '../opensearch-utils';
import { $TSObject } from 'amplify-cli-core';

export const transformUtils = {
  toDynamoDBConditionExpression: condition => {
    const result = generateFilterExpression(condition.toJSON());
    return JSON.stringify({
      expression: result.expressions.join(' ').trim(),
      expressionNames: result.expressionNames,
    });
  },

  toDynamoDBFilterExpression: filter => {
    const result = generateFilterExpression(filter.toJSON());
    return JSON.stringify({
      expression: result.expressions.join(' ').trim(),
      expressionNames: result.expressionNames,
      expressionValues: result.expressionValues,
    });
  },

  toElasticsearchQueryDSL: filter => {
    const elasticsearchHelper: ElasticsearchHelper = new ElasticsearchHelper();
    if (!filter) {
      return null;
    }

    try {
      const queryDSL: $TSObject = elasticsearchHelper.getQueryDSL(filter.toJSON());
      return JSON.stringify(queryDSL);
    }
    catch (err) {
        console.error("Error when constructing the Elasticsearch Query DSL using the model transform utils. {}");
        console.error(err);
        return null;
    }
  }
};
