'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createFunctionDefinition = exports.renderFunctions = void 0;
const typescript_1 = __importDefault(require('typescript'));
// eslint-disable-next-line import/no-extraneous-dependencies
const client_lambda_1 = require('@aws-sdk/client-lambda');
const resource_1 = require('../../resource/resource');
const node_assert_1 = __importDefault(require('node:assert'));
const factory = typescript_1.default.factory;
const amplifyGen1EnvName = 'AMPLIFY_GEN_1_ENV_NAME';
const createParameter = (name, value) => factory.createPropertyAssignment(factory.createIdentifier(name), value);
const createVariableStatement = (variableDeclaration) => {
  return factory.createVariableStatement(
    [],
    factory.createVariableDeclarationList([variableDeclaration], typescript_1.default.NodeFlags.Const),
  );
};
const createTemplateLiteral = (templateHead, templateSpan, templateTail) => {
  return factory.createTemplateExpression(factory.createTemplateHead(templateHead), [
    factory.createTemplateSpan(factory.createIdentifier(templateSpan), factory.createTemplateTail(templateTail)),
  ]);
};
function renderFunctions(definition, appId, backendEnvironmentName) {
  const postImportStatements = [];
  const namedImports = { '@aws-amplify/backend': new Set() };
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
  return (0, resource_1.renderResourceTsFile)({
    exportedVariableName: factory.createIdentifier(definition?.resourceName || 'sayHello'),
    functionCallParameter: factory.createObjectLiteralExpression(defineFunctionProperty, true),
    backendFunctionConstruct: 'defineFunction',
    additionalImportedBackendIdentifiers: namedImports,
    postImportStatements,
  });
}
exports.renderFunctions = renderFunctions;
function createFunctionDefinition(definition, postImportStatements, namedImports, appId, backendEnvironmentName) {
  const defineFunctionProperties = [];
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
                const namedImports = { '@aws-amplify/backend': new Set() };
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
    let nodeRuntime;
    switch (runtime) {
      case client_lambda_1.Runtime.nodejs16x:
        nodeRuntime = 16;
        break;
      case client_lambda_1.Runtime.nodejs18x:
        nodeRuntime = 18;
        break;
      case client_lambda_1.Runtime.nodejs20x:
        nodeRuntime = 20;
        break;
      default:
        throw new Error(`Unsupported nodejs runtime for function: ${runtime}`);
    }
    (0, node_assert_1.default)(nodeRuntime, 'Expected nodejs version to be set');
    defineFunctionProperties.push(createParameter('runtime', factory.createNumericLiteral(nodeRuntime)));
  }
  if (definition?.schedule) {
    const rawScheduleExpression = definition.schedule;
    let scheduleExpression;
    const startIndex = rawScheduleExpression.indexOf('(') + 1;
    const endIndex = rawScheduleExpression.lastIndexOf(')');
    const scheduleValue = startIndex > 0 && endIndex > startIndex ? rawScheduleExpression.slice(startIndex, endIndex) : undefined;
    if (rawScheduleExpression?.startsWith('rate(')) {
      // Convert rate expression to a more readable format
      const rateValue = scheduleValue;
      if (rateValue) {
        const [value, unit] = rateValue.split(' ');
        const unitMap = {
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
exports.createFunctionDefinition = createFunctionDefinition;
//# sourceMappingURL=index.js.map
