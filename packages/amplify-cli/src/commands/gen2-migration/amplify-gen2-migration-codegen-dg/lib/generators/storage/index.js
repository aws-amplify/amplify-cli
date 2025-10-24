'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.renderStorage = void 0;
const typescript_1 = __importDefault(require('typescript'));
const access_1 = require('./access');
const resource_1 = require('../../resource/resource');
const lambda_1 = require('../functions/lambda');
const factory = typescript_1.default.factory;
const amplifyGen1EnvName = 'AMPLIFY_GEN_1_ENV_NAME';
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
const renderStorage = (storageParams = {}) => {
  var _a;
  const propertyAssignments = [];
  const namedImports = { '@aws-amplify/backend': new Set() };
  namedImports['@aws-amplify/backend'].add('defineStorage');
  const triggers = storageParams.triggers || {};
  const postImportStatements = [];
  const amplifyGen1EnvStatement = createVariableStatement(
    factory.createVariableDeclaration(
      amplifyGen1EnvName,
      undefined,
      undefined,
      factory.createIdentifier('process.env.AMPLIFY_GEN_1_ENV_NAME ?? "sandbox"'),
    ),
  );
  postImportStatements.push(amplifyGen1EnvStatement);
  if (storageParams.storageIdentifier) {
    const splitStorageIdentifier = storageParams.storageIdentifier.split('-');
    const storageNameWithoutBackendEnvName = splitStorageIdentifier.slice(0, -1).join('-');
    const storageNameAssignment = createTemplateLiteral(`${storageNameWithoutBackendEnvName}-`, amplifyGen1EnvName, '');
    propertyAssignments.push(factory.createPropertyAssignment(factory.createIdentifier('name'), storageNameAssignment));
  }
  if (storageParams.accessPatterns) {
    propertyAssignments.push((0, access_1.getAccessPatterns)(storageParams.accessPatterns));
  }
  if ((_a = storageParams.accessPatterns) === null || _a === void 0 ? void 0 : _a.groups) {
    postImportStatements.push(
      factory.createJSDocComment(
        factory.createNodeArray([
          factory.createJSDocText('TODO: Your project uses group permissions. Group permissions have changed in Gen 2. '),
          factory.createJSDocText(
            'In order to grant permissions to groups in Gen 2, please refer to https://docs.amplify.aws/react/build-a-backend/storage/authorization/#for-gen-1-public-protected-and-private-access-pattern.',
          ),
        ]),
      ),
    );
  }
  if (Object.keys(triggers).length) {
    propertyAssignments.push((0, lambda_1.createTriggersProperty)(triggers));
    for (const value of Object.values(triggers)) {
      const functionName = value.source.split('/')[3];
      if (!namedImports[`./${functionName}/resource`]) {
        namedImports[`./${functionName}/resource`] = new Set();
      }
      namedImports[`./${functionName}/resource`].add(functionName);
    }
  }
  const storageArgs = factory.createObjectLiteralExpression(propertyAssignments);
  return (0, resource_1.renderResourceTsFile)({
    backendFunctionConstruct: 'defineStorage',
    exportedVariableName: factory.createIdentifier('storage'),
    functionCallParameter: storageArgs,
    postImportStatements,
    additionalImportedBackendIdentifiers: namedImports,
  });
};
exports.renderStorage = renderStorage;
//# sourceMappingURL=index.js.map
