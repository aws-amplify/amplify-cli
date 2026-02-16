import ts from 'typescript';
export type Lambda = {
  source: string;
};

const factory = ts.factory;

export const createTriggersProperty = (triggers: Record<string, Lambda>) => {
  return factory.createPropertyAssignment(
    factory.createIdentifier('triggers'),
    factory.createObjectLiteralExpression(
      Object.entries(triggers).map(([key, value]) => {
        const functionName = value.source.split('/')[3];
        return factory.createPropertyAssignment(factory.createIdentifier(key), factory.createIdentifier(functionName));
      }),
      true,
    ),
  );
};
