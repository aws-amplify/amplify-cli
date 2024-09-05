import ts, { ObjectLiteralElementLike, SyntaxKind } from 'typescript';
import { FunctionDefinition, createFunctionDefinition } from './source_builder';

export type Lambda = {
  source: string;
};

const factory = ts.factory;

export const defineFunctionIdentifier = 'defineFunction';

export const createDefineFunctionCall = (parameter?: FunctionDefinition): ts.CallExpression => {
  const parameters = createFunctionDefinition(parameter);
  return factory.createCallExpression(factory.createIdentifier(defineFunctionIdentifier), undefined, [
    factory.createObjectLiteralExpression(parameters),
  ]);
};

export const createTriggersProperty = (triggers: Record<string, Lambda>) => {
  return factory.createPropertyAssignment(
    factory.createIdentifier('triggers'),
    factory.createObjectLiteralExpression(
      Object.entries(triggers).map(([key, { source }]) => {
        return ts.addSyntheticLeadingComment(
          factory.createPropertyAssignment(key, createDefineFunctionCall({ entry: source })),
          SyntaxKind.MultiLineCommentTrivia,
          `\nSource code for this function can be found in your Amplify Gen 1 Directory.\nSee ${source}\n`,
          true,
        );
      }),
      true,
    ),
  );
};
