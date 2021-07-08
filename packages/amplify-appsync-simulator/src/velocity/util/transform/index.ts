import { generateFilterExpression } from './dynamodb-filter';
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
};
