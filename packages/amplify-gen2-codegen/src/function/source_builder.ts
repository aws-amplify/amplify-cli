import ts, { ObjectLiteralElementLike } from 'typescript';
import { EnvironmentResponse, Runtime } from '@aws-sdk/client-lambda';
import { renderResourceTsFile } from '../resource/resource';

export interface FunctionDefinition {
  category?: string;
  entry?: string;
  name?: string;
  timeoutSeconds?: number;
  memoryMB?: number;
  environment?: EnvironmentResponse;
  runtime?: Runtime | string;
}

const factory = ts.factory;

const createParameter = (name: string, value: ts.LiteralExpression | ts.ObjectLiteralExpression): ts.PropertyAssignment =>
  factory.createPropertyAssignment(factory.createIdentifier(name), value);

export function renderFunctions(definition: FunctionDefinition) {
  const groupsComment = [];
  const namedImports: string[] = [];

  groupsComment.push(
    factory.createJSDocComment(
      factory.createNodeArray([
        factory.createJSDocText(
          `Source code for this function can be found in your Amplify Gen 1 Directory.\nSee amplify/backend/function/${
            definition.name?.split('-')[0]
          }/src \n`,
        ),
      ]),
    ),
  );

  const defineFunctionProperty = createFunctionDefinition(definition, groupsComment, namedImports);

  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier(definition?.name?.split('-')[0] || 'sayHello'),
    functionCallParameter: factory.createObjectLiteralExpression(defineFunctionProperty, true),
    backendFunctionConstruct: 'defineFunction',
    additionalImportedBackendIdentifiers: namedImports,
    importedPackageName: '@aws-amplify/backend',
    postImportStatements: groupsComment,
  });
}

export function createFunctionDefinition(definition?: FunctionDefinition, groupsComment?: any[], namedImports?: string[]) {
  const defineFunctionProperties: ObjectLiteralElementLike[] = [];

  if (definition?.entry) {
    defineFunctionProperties.push(createParameter('entry', factory.createStringLiteral('./handler.ts')));
  }
  if (definition?.name) {
    defineFunctionProperties.push(createParameter('name', factory.createStringLiteral(definition.name)));
  }
  if (definition?.timeoutSeconds) {
    defineFunctionProperties.push(createParameter('timeoutSeconds', factory.createNumericLiteral(definition.timeoutSeconds)));
  }
  if (definition?.memoryMB) {
    defineFunctionProperties.push(createParameter('memoryMB', factory.createNumericLiteral(definition.memoryMB)));
  }

  if (definition?.environment?.Variables) {
    defineFunctionProperties.push(
      createParameter(
        'environment',
        factory.createObjectLiteralExpression(
          Object.entries(definition.environment.Variables).map(([key, value]) => {
            if (key == 'API_KEY') {
              groupsComment!.push(
                factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
                  factory.createStringLiteral('Secrets need to be reset, use `npx ampx sandbox secret API_KEY` to set the value'),
                ]),
              );
              namedImports!.push('secret');
              return factory.createPropertyAssignment(
                key,
                factory.createCallExpression(factory.createIdentifier('secret'), undefined, [factory.createStringLiteral(value)]),
              );
            }

            return createParameter(key, factory.createStringLiteral(value));
          }),
        ),
      ),
    );
  }

  let nodeRuntime = 0;
  if (definition?.runtime) {
    const runtime = definition?.runtime;
    if (runtime === Runtime.nodejs16x) {
      nodeRuntime = 16;
    } else if (runtime === Runtime.nodejs18x) {
      nodeRuntime = 18;
    }

    defineFunctionProperties.push(createParameter('runtime', factory.createNumericLiteral(nodeRuntime)));
  }

  return defineFunctionProperties;
}
