import ts, { ObjectLiteralElementLike } from 'typescript';
import { EnvironmentResponse, Runtime } from '@aws-sdk/client-lambda';
import { renderResourceTsFile } from '../resource/resource';
import assert from 'node:assert';

export interface FunctionDefinition {
  category?: string;
  entry?: string;
  name?: string;
  timeoutSeconds?: number;
  memoryMB?: number;
  environment?: EnvironmentResponse;
  runtime?: Runtime | string;
  resourceName?: string;
}

const factory = ts.factory;

const createParameter = (name: string, value: ts.LiteralExpression | ts.ObjectLiteralExpression): ts.PropertyAssignment =>
  factory.createPropertyAssignment(factory.createIdentifier(name), value);

export function renderFunctions(definition: FunctionDefinition, appId?: string, backendEnvironmentName?: string | undefined) {
  const groupsComment: (ts.CallExpression | ts.JSDoc)[] = [];
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineFunction');

  groupsComment.push(
    factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
      factory.createStringLiteral(
        `Source code for this function can be found in your Amplify Gen 1 Directory. See .amplify/migration/amplify/backend/function/${definition.resourceName}/src`,
      ),
    ]),
  );

  const defineFunctionProperty = createFunctionDefinition(definition, groupsComment, namedImports, appId, backendEnvironmentName);

  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier(definition?.resourceName || 'sayHello'),
    functionCallParameter: factory.createObjectLiteralExpression(defineFunctionProperty, true),
    backendFunctionConstruct: 'defineFunction',
    additionalImportedBackendIdentifiers: namedImports,
    postImportStatements: groupsComment,
  });
}

export function createFunctionDefinition(
  definition?: FunctionDefinition,
  groupsComment?: (ts.CallExpression | ts.JSDoc)[],
  namedImports?: Record<string, Set<string>>,
  appId?: string,
  backendEnvironmentName?: string,
) {
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
            if (key == 'API_KEY' && value.startsWith(`/amplify/${appId}/${backendEnvironmentName}`)) {
              groupsComment?.push(
                factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
                  // eslint-disable-next-line spellcheck/spell-checker
                  factory.createStringLiteral('Secrets need to be reset, use `npx ampx sandbox secret set API_KEY` to set the value'),
                ]),
              );
              if (namedImports && namedImports['@aws-amplify/backend']) {
                namedImports['@aws-amplify/backend'].add('secret');
              } else {
                const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
                namedImports['@aws-amplify/backend'].add('secret');
              }
              return factory.createPropertyAssignment(
                key,
                factory.createCallExpression(factory.createIdentifier('secret'), undefined, [factory.createStringLiteral('API_KEY')]),
              );
            }

            return createParameter(key, factory.createStringLiteral(value));
          }),
        ),
      ),
    );
  }

  let nodeRuntime = 0;
  const runtime = definition?.runtime;
  if (runtime) {
    switch (runtime) {
      case Runtime.nodejs16x:
        nodeRuntime = 16;
        break;
      case Runtime.nodejs18x:
        nodeRuntime = 18;
        break;
      case Runtime.nodejs20x:
        nodeRuntime = 20;
        break;
      case Runtime.nodejs22x:
        nodeRuntime = 22;
        break;
      default:
        throw new Error(`Unsupported nodejs runtime for function: ${runtime}`);
    }

    defineFunctionProperties.push(createParameter('runtime', factory.createNumericLiteral(nodeRuntime)));
  }

  return defineFunctionProperties;
}
