import { compoundExpression, Expression, obj, printBlock, str, toJson, nul } from 'graphql-mapping-template';

export const generateSubscriptionRequestTemplate = (): string => {
  const statements: Expression[] = [toJson(obj({ version: str('2018-05-29'), payload: obj({}) }))];
  return printBlock('Subscription Request template')(compoundExpression(statements));
};

export const generateSubscriptionResponseTemplate = (): string => {
  const statements: Expression[] = [toJson(nul())];
  return printBlock('Subscription Response template')(compoundExpression(statements));
};
