import ts, { CallExpression, Identifier } from 'typescript';
import { AccessPatterns, Permission } from '.';
const factory = ts.factory;

/**
 * /public/, /protected/{cognito:sub}/, and /private/{cognito:sub}/
 * @see https://docs.amplify.aws/gen1/react/build-a-backend/storage/configure-storage/#s3-access-permissions
 */

type AccessPath = 'public/*' | 'private/{entity_id}/*' | 'protected/{entity_id}/*' | string;

type UserLevel = 'guest' | 'authenticated' | `entity('identity')` | `groups(['${string}'])` | `resource(${string})`;

const createAllowPattern = (allowIdentifier: Identifier, userLevel: UserLevel, permissions: Permission[]) => {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(allowIdentifier, factory.createIdentifier(`${userLevel}.to`)),
    undefined,
    [factory.createArrayLiteralExpression(permissions.map((p) => factory.createStringLiteral(p)))],
  );
};

/**
 * Creates a resource access pattern for functions
 * @param allowIdentifier - The 'allow' identifier
 * @param functionName - Name of the function
 * @param permissions - Array of permissions
 * @returns CallExpression for the resource access pattern
 */
const createResourcePattern = (allowIdentifier: Identifier, functionName: string, permissions: Permission[]) => {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(allowIdentifier, factory.createIdentifier('resource')),
        undefined,
        [factory.createIdentifier(functionName)],
      ),
      factory.createIdentifier('to'),
    ),
    undefined,
    [factory.createArrayLiteralExpression(permissions.map((p) => factory.createStringLiteral(p)))],
  );
};

export const getAccessPatterns = (accessPatterns: AccessPatterns): ts.PropertyAssignment => {
  const accessIdentifier = factory.createIdentifier('access');
  const allowIdentifier = factory.createIdentifier('allow');

  const publicPathAccess = [];
  const privatePathAccess = [];
  const protectedPathAccess = [];
  const functionPathAccess: { [path: string]: CallExpression[] } = {};

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

  // Handle function access patterns - consolidate by function and merge permissions
  if (accessPatterns.functions && accessPatterns.functions.length) {
    const consolidatedFunctions: { [functionName: string]: { pathPattern: string; permissions: Set<Permission> } } = {};

    // Consolidate permissions by function
    accessPatterns.functions.forEach(({ functionName, pathPattern, permissions }) => {
      if (!consolidatedFunctions[functionName]) {
        consolidatedFunctions[functionName] = {
          pathPattern: pathPattern, // Keep original path pattern from CloudFormation
          permissions: new Set(permissions),
        };
      } else {
        // Merge permissions
        permissions.forEach((p) => consolidatedFunctions[functionName].permissions.add(p));
      }
    });

    // Create access patterns for each function
    Object.entries(consolidatedFunctions).forEach(([functionName, { pathPattern, permissions }]) => {
      const resourcePattern = createResourcePattern(allowIdentifier, functionName, Array.from(permissions));

      if (!functionPathAccess[pathPattern]) {
        functionPathAccess[pathPattern] = [];
      }
      functionPathAccess[pathPattern].push(resourcePattern);
    });
  }

  const publicPath: AccessPath = 'public/*';
  const privatePath: AccessPath = 'private/{entity_id}/*';
  const protectedPath: AccessPath = 'protected/{entity_id}/*';

  const allowAssignments: ts.PropertyAssignment[] = [];

  const createAccessPropertyAssignment = (bucketPath: string, accessArray: CallExpression[]) =>
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

  // Add function-specific path access patterns
  Object.entries(functionPathAccess).forEach(([pathPattern, accessArray]) => {
    allowAssignments.push(createAccessPropertyAssignment(pathPattern, accessArray));
  });

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
