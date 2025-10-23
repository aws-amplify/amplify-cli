import ts from 'typescript';
import { ObjectLiteralElementLike, VariableDeclaration, VariableStatement } from 'typescript';
import { EnvironmentResponse, Runtime } from '@aws-sdk/client-lambda';
import { renderResourceTsFile } from '../../resource/resource';
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
  schedule?: string;
}

const factory = ts.factory;

const amplifyGen1EnvName = 'AMPLIFY_GEN_1_ENV_NAME';

const createParameter = (
  name: string,
  value: ts.LiteralExpression | ts.ObjectLiteralExpression | ts.TemplateExpression,
): ts.PropertyAssignment => factory.createPropertyAssignment(factory.createIdentifier(name), value);

const createVariableStatement = (variableDeclaration: VariableDeclaration): VariableStatement => {
  return factory.createVariableStatement([], factory.createVariableDeclarationList([variableDeclaration], ts.NodeFlags.Const));
};

const createTemplateLiteral = (templateHead: string, templateSpan: string, templateTail: string) => {
  return factory.createTemplateExpression(factory.createTemplateHead(templateHead), [
    factory.createTemplateSpan(factory.createIdentifier(templateSpan), factory.createTemplateTail(templateTail)),
  ]);
};

export function renderFunctions(definition: FunctionDefinition, appId?: string, backendEnvironmentName?: string | undefined) {
  const postImportStatements = [];
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineFunction');

  postImportStatements.push(
    factory.createExpressionStatement(
      factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
        factory.createStringLiteral(
          `Source code for this function can be found in your Amplify Gen 1 Directory. See .amplify/migration/amplify/backend/function/${definition.resourceName}/src`,
        ),
      ]),
    ),
  );

  const defineFunctionProperty = createFunctionDefinition(definition, postImportStatements, namedImports, appId, backendEnvironmentName);

  const amplifyGen1EnvStatement = createVariableStatement(
    factory.createVariableDeclaration(
      amplifyGen1EnvName,
      undefined,
      undefined,
      factory.createIdentifier('process.env.AMPLIFY_GEN_1_ENV_NAME ?? "sandbox"'),
    ),
  );
  postImportStatements.push(amplifyGen1EnvStatement);

  return renderResourceTsFile({
    exportedVariableName: factory.createIdentifier(definition?.resourceName || 'sayHello'),
    functionCallParameter: factory.createObjectLiteralExpression(defineFunctionProperty, true),
    backendFunctionConstruct: 'defineFunction',
    additionalImportedBackendIdentifiers: namedImports,
    postImportStatements,
  });
}

export function createFunctionDefinition(
  definition?: FunctionDefinition,
  postImportStatements?: (ts.CallExpression | ts.JSDoc | ts.ExpressionStatement)[],
  namedImports?: Record<string, Set<string>>,
  appId?: string,
  backendEnvironmentName?: string,
) {
  const defineFunctionProperties: ObjectLiteralElementLike[] = [];

  if (definition?.entry) {
    defineFunctionProperties.push(createParameter('entry', factory.createStringLiteral('./handler.ts')));
  }
  if (definition?.name) {
    const splitFuncName = definition.name.split('-');
    const funcNameWithoutBackendEnvName = splitFuncName.slice(0, -1).join('-');

    const funcNameAssignment = createTemplateLiteral(`${funcNameWithoutBackendEnvName}-`, amplifyGen1EnvName, '');

    defineFunctionProperties.push(createParameter('name', funcNameAssignment));
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
              postImportStatements?.push(
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
            } else if (key == 'ENV') {
              const envNameAssignment = createTemplateLiteral('', amplifyGen1EnvName, '');
              return createParameter(key, envNameAssignment);
            }

            return createParameter(key, factory.createStringLiteral(value));
          }),
        ),
      ),
    );
  }

  const runtime = definition?.runtime;
  if (runtime && runtime.includes('nodejs')) {
    let nodeRuntime: number | undefined;
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
      case 'nodejs22x':
        nodeRuntime = 22;
        break;
      default:
        throw new Error(`Unsupported nodejs runtime for function: ${runtime}`);
    }
    assert(nodeRuntime, 'Expected nodejs version to be set');

    defineFunctionProperties.push(createParameter('runtime', factory.createNumericLiteral(nodeRuntime)));
  }

  if (definition?.schedule) {
    const rawScheduleExpression = definition.schedule;
    let scheduleExpression: string | undefined;
    const startIndex = rawScheduleExpression.indexOf('(') + 1;
    const endIndex = rawScheduleExpression.lastIndexOf(')');
    const scheduleValue = startIndex > 0 && endIndex > startIndex ? rawScheduleExpression.slice(startIndex, endIndex) : undefined;
    if (rawScheduleExpression?.startsWith('rate(')) {
      // Convert rate expression to a more readable format
      const rateValue = scheduleValue;
      if (rateValue) {
        const [value, unit] = rateValue.split(' ');
        const unitMap: Record<string, string> = {
          minute: 'm',
          minutes: 'm',
          hour: 'h',
          hours: 'h',
          day: 'd',
          days: 'd',
        };
        scheduleExpression = `every ${value}${unitMap[unit]}`;
      }
    } else if (rawScheduleExpression?.startsWith('cron(')) {
      // Extract the cron expression as-is
      scheduleExpression = scheduleValue;
    }

    if (scheduleExpression) {
      defineFunctionProperties.push(createParameter('schedule', factory.createStringLiteral(scheduleExpression)));
    }
  }

  return defineFunctionProperties;
}
