import { dynamodbUtils } from '../dynamodb-utils';
type DDBFilterExpression = {
  expressions: string[];
  expressionNames: { [key: string]: string };
  expressionValues: { [key: string]: string };
};

const OPERATOR_MAP = {
  ne: '<>',
  eq: '=',
  lt: '<',
  le: '<=',
  gt: '>',
  ge: '>=',
};

const FUNCTION_MAP = {
  contains: 'contains',
  notContains: 'NOT contains',
  beginsWith: 'begins_with',
};

export function generateFilterExpression(
  filter: any,
  prefix = null,
  parent = null,
): DDBFilterExpression {
  const expr = Object.entries(filter).reduce(
    (sum, [name, value]) => {
      let subExpr = {
        expressions: [],
        expressionNames: {},
        expressionValues: {},
      };
      const fieldName = createExpressionFieldName(parent);
      const filedValueName = createExpressionValueName(parent, name, prefix);

      switch (name) {
        case 'or':
        case 'and':
          const JOINER = name === 'or' ? 'OR' : 'AND';
          if (Array.isArray(value)) {
            subExpr = scopeExpression(
              value.reduce((expr, subFilter, idx) => {
                const newExpr = generateFilterExpression(
                  subFilter,
                  [prefix, name, idx].filter(i => i !== null).join('_'),
                );
                return merge(expr, newExpr, JOINER);
              }, subExpr),
            );
          } else {
            subExpr = generateFilterExpression(
              value,
              [prefix, name].filter(val => val !== null).join('_'),
            );
          }
          break;
        case 'not':
          subExpr = scopeExpression(
            generateFilterExpression(value, [prefix, name].filter(val => val !== null).join('_')),
          );
          subExpr.expressions.unshift('NOT');
          break;
        case 'between':
          const expr1 = createExpressionValueName(parent, 'between_1', prefix);
          const expr2 = createExpressionValueName(parent, 'between_2', prefix);
          const exprName = createExpressionName(parent);
          const subExprExpr = `${createExpressionFieldName(parent)} BETWEEN ${expr1} AND ${expr2}`;
          const exprValues = {
            ...createExpressionValue(parent, 'between_1', value[0], prefix),
            ...createExpressionValue(parent, 'between_2', value[1], prefix),
          };
          subExpr = {
            expressions: [subExprExpr],
            expressionNames: exprName,
            expressionValues: exprValues,
          };
          break;
        case 'ne':
        case 'eq':
        case 'gt':
        case 'ge':
        case 'lt':
        case 'le':
          const operator = OPERATOR_MAP[name];
          subExpr = {
            expressions: [`${fieldName} ${operator} ${filedValueName}`],
            expressionNames: createExpressionName(parent),
            expressionValues: createExpressionValue(parent, name, value, prefix),
          };
          break;
        case 'contains':
        case 'notContains':
        case 'beginsWith':
          const functionName = FUNCTION_MAP[name];
          subExpr = {
            expressions: [`${functionName}(${fieldName}, ${filedValueName})`],
            expressionNames: createExpressionName(parent),
            expressionValues: createExpressionValue(parent, name, value, prefix),
          };
          break;
        default:
          subExpr = scopeExpression(generateFilterExpression(value, prefix, name));
      }
      return merge(sum, subExpr);
    },
    {
      expressions: [],
      expressionNames: {},
      expressionValues: {},
    },
  );

  return expr;
}

function merge(
  expr1: DDBFilterExpression,
  expr2: DDBFilterExpression,
  joinCondition = 'AND',
): DDBFilterExpression {
  if (!expr2.expressions.length) {
    return expr1;
  }

  return {
    expressions: [
      ...expr1.expressions,
      expr1.expressions.length ? joinCondition : '',
      ...expr2.expressions,
    ],
    expressionNames: { ...expr1.expressionNames, ...expr2.expressionNames },
    expressionValues: { ...expr1.expressionValues, ...expr2.expressionValues },
  };
}

function createExpressionValueName(fieldName, op, prefix?) {
  return `:${[prefix, fieldName, op].filter(name => name).join('_')}`;
}
function createExpressionName(fieldName) {
  return {
    [createExpressionFieldName(fieldName)]: fieldName,
  };
}

function createExpressionFieldName(fieldName) {
  return `#${fieldName}`;
}
function createExpressionValue(fieldName, op, value, prefix?) {
  const exprName = createExpressionValueName(fieldName, op, prefix);
  const exprValue = dynamodbUtils.toDynamoDB(value);
  return {
    [`${exprName}`]: exprValue,
  };
}

function scopeExpression(expr) {
  const result = { ...expr };
  result.expressions = result.expressions.filter(e => !!e);
  if (result.expressions.length > 1) {
    result.expressions = ['(' + result.expressions.join(' ') + ')'];
  }
  return result;
}
