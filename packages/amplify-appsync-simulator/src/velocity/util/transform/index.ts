import { generateFilterExpression } from './dynamodb-filter';
export const transformUtils = {
  toDynamoDBFilterExpression: filter => {
    const result = generateFilterExpression(filter.toJSON());
    return JSON.stringify({
      expression: result.expressions.join(' ').trim(),
      expressionNames: result.expressionNames,
      expressionValues: result.expressionValues,
    });
  },
};
