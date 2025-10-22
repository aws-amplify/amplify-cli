'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.getAccessPatterns = void 0;
const typescript_1 = __importDefault(require('typescript'));
const factory = typescript_1.default.factory;
const createAllowPattern = (allowIdentifier, userLevel, permissions) => {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(allowIdentifier, factory.createIdentifier(`${userLevel}.to`)),
    undefined,
    [factory.createArrayLiteralExpression(permissions.map((p) => factory.createStringLiteral(p)))],
  );
};
const getAccessPatterns = (accessPatterns) => {
  const accessIdentifier = factory.createIdentifier('access');
  const allowIdentifier = factory.createIdentifier('allow');
  const publicPathAccess = [];
  const privatePathAccess = [];
  const protectedPathAccess = [];
  if (accessPatterns.guest && accessPatterns.guest.length) {
    publicPathAccess.push(createAllowPattern(allowIdentifier, 'guest', accessPatterns.guest ?? []));
  }
  if (accessPatterns.auth && accessPatterns.auth.length) {
    const accessPattern = createAllowPattern(allowIdentifier, 'authenticated', accessPatterns.auth ?? []);
    publicPathAccess.push(accessPattern);
    protectedPathAccess.push(accessPattern);
    privatePathAccess.push(accessPattern);
  }
  if (accessPatterns.groups && Object.keys(accessPatterns.groups).length) {
    Object.entries(accessPatterns.groups).forEach(([key, value]) => {
      publicPathAccess.push(createAllowPattern(allowIdentifier, `groups(['${key}'])`, value));
      privatePathAccess.push(createAllowPattern(allowIdentifier, `groups(['${key}'])`, value));
      protectedPathAccess.push(createAllowPattern(allowIdentifier, `groups(['${key}'])`, value));
    });
  }
  const publicPath = 'public/*';
  const privatePath = 'private/{entity_id}/*';
  const protectedPath = 'protected/{entity_id}/*';
  const allowAssignments = [];
  const createAccessPropertyAssignment = (bucketPath, accessArray) =>
    factory.createPropertyAssignment(factory.createStringLiteral(bucketPath), factory.createArrayLiteralExpression(accessArray));
  if (publicPathAccess.length) {
    allowAssignments.push(createAccessPropertyAssignment(publicPath, publicPathAccess));
  }
  if (protectedPathAccess.length) {
    allowAssignments.push(createAccessPropertyAssignment(protectedPath, protectedPathAccess));
  }
  if (privatePathAccess.length) {
    allowAssignments.push(createAccessPropertyAssignment(privatePath, privatePathAccess));
  }
  const accessFunction = factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, allowIdentifier)],
    undefined,
    undefined,
    factory.createParenthesizedExpression(factory.createObjectLiteralExpression(allowAssignments, true)),
  );
  return factory.createPropertyAssignment(accessIdentifier, accessFunction);
};
exports.getAccessPatterns = getAccessPatterns;
//# sourceMappingURL=access.js.map
