import {
  CompoundExpressionNode,
  Expression,
  comment,
  iff,
  and,
  ref,
  notEquals,
  methodCall,
  int,
  compoundExpression,
  set,
  obj,
  equals,
  ifElse,
  printBlock,
  toJson,
} from 'graphql-mapping-template';

/**
 * Helper method to generate code that converts DynamoDB condition object to condition
 * expression
 * @param inputConditionObjectName : Variable in stash that holds condition object
 * @param conditionOutputVariableName: Variable to store generated DDB expression
 */
export const generateConditionSlot = (inputConditionObjectName: string, conditionOutputVariableName: string): CompoundExpressionNode => {
  const statements: Expression[] = [
    comment('Start condition block'),

    iff(
      and([ref(inputConditionObjectName), notEquals(methodCall(ref(`${inputConditionObjectName}.size`)), int(0))]),
      compoundExpression([
        set(ref('mergedConditions'), obj({ and: ref(inputConditionObjectName) })),
        set(
          ref(conditionOutputVariableName),
          methodCall(ref('util.parseJson'), methodCall(ref('util.transform.toDynamoDBConditionExpression'), ref('mergedConditions'))),
        ),
        iff(
          and([
            ref(`${conditionOutputVariableName}.expressionValues`),
            equals(methodCall(ref(`${conditionOutputVariableName}.expressionValues.size`)), int(0)),
          ]),
          set(
            ref(conditionOutputVariableName),
            obj({
              expression: ref(`${conditionOutputVariableName}.expression`),
              expressionNames: ref(`${conditionOutputVariableName}.expressionNames`),
            }),
          ),
        ),
        comment('End condition block'),
      ]),
    ),
  ];
  return compoundExpression(statements);
};

/**
 * Generate common response template used by most of the resolvers.
 */
export const generateDefaultResponseMappingTemplate = (isSyncEnabled: boolean): string => {
  const statements: Expression[] = [];
  if (isSyncEnabled) {
    statements.push(
      ifElse(
        ref('ctx.error'),
        methodCall(ref('util.error'), ref('ctx.error.message'), ref('ctx.error.type'), ref('ctx.result')),
        toJson(ref('ctx.result')),
      ),
    );
  } else {
    statements.push(
      ifElse(ref('ctx.error'), methodCall(ref('util.error'), ref('ctx.error.message'), ref('ctx.error.type')), toJson(ref('ctx.result'))),
    );
  }

  return printBlock('Get ResponseTemplate')(compoundExpression(statements));
};

/**
 * Util function to gernate resolver key used to keep track of all the resolvers in memory
 * @param typeName Name of the type
 * @param fieldName Name of the field
 */
export const generateResolverKey = (typeName: string, fieldName: string): string => {
  return `${typeName}.${fieldName}`;
};
