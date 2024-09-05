import ts, { ObjectLiteralElementLike } from 'typescript';
import { EnvironmentResponse, Runtime } from '@aws-sdk/client-lambda';
import { renderResourceTsFilesForFunction } from '../resource/resource';

export interface FunctionDefinition {
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

export function renderFunctions(definitions: FunctionDefinition[]) {
  const defineFunctionProperties: ts.ObjectLiteralExpression[] = [];
  const exportedVariableNames: ts.Identifier[] = [];

  for (const definition of definitions) {
    const defineFunctionProperty = createFunctionDefinition(definition);
    defineFunctionProperties.push(factory.createObjectLiteralExpression(defineFunctionProperty, true));
    exportedVariableNames.push(factory.createIdentifier(definition?.name?.split('-')[0] || 'sayHello'));
  }

  return renderResourceTsFilesForFunction({
    exportedVariableName: exportedVariableNames,
    functionCallParameter: defineFunctionProperties,
    backendFunctionConstruct: 'defineFunction',
    importedPackageName: '@aws-amplify/backend',
  });
}

export function createFunctionDefinition(definition?: FunctionDefinition) {
  const defineFunctionProperties: ObjectLiteralElementLike[] = [];

  if (definition?.entry && definition?.name) {
    const entry = definition.name?.split('-')[0];
    defineFunctionProperties.push(createParameter('entry', factory.createStringLiteral('./' + entry + '/src/handler.ts')));
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
