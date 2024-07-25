import ts, { ObjectLiteralElementLike, SyntaxKind } from 'typescript';
export type Lambda = {
  source: string;
};

const factory = ts.factory;

export const defineFunctionIdentifier = 'defineFunction';

export interface DefineFunctionParamter {
  entry?: string;
  name?: string;
  timeoutSeconds?: string;
  memoryMB?: number;
  environment?: Record<string, string>;
  runtime?: 16 | 18 | 19;
}

const createParameter = (name: string, value: any) => factory.createPropertyAssignment(factory.createIdentifier(name), value);

export const createDefineFunctionCall = (parameter?: DefineFunctionParamter): ts.CallExpression => {
  const parameters: ObjectLiteralElementLike[] = [];
  if (parameter?.entry) {
    parameters.push(createParameter('entry', factory.createStringLiteral(parameter.entry)));
  }
  if (parameter?.name) {
    parameters.push(createParameter('name', factory.createStringLiteral(parameter.name)));
  }
  if (parameter?.timeoutSeconds) {
    parameters.push(createParameter('timeoutSeconds', factory.createStringLiteral(parameter.timeoutSeconds)));
  }
  if (parameter?.memoryMB) {
    parameters.push(createParameter('memoryMB', factory.createNumericLiteral(parameter.memoryMB)));
  }
  if (parameter?.environment) {
    parameters.push(
      createParameter(
        'environment',
        factory.createObjectLiteralExpression(
          Object.entries(parameter.environment).map(([key, value]) => {
            return createParameter(key, factory.createStringLiteral(value));
          }),
        ),
      ),
    );
  }
  if (parameter?.runtime) {
    parameters.push(createParameter('runtime', factory.createNumericLiteral(parameter.runtime)));
  }
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
