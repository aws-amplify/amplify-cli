import ts from 'typescript';
const factory = ts.factory;

export const createTodoError = (todoMessage: string) =>
  factory.createThrowStatement(
    factory.createNewExpression(factory.createIdentifier('Error'), undefined, [factory.createStringLiteral(`TODO: ${todoMessage}`)]),
  );
