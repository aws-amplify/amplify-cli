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

  // Handle function access patterns - add to all default paths
  if (accessPatterns.functions && accessPatterns.functions.length) {
    const consolidatedFunctions: { [functionName: string]: Set<Permission> } = {};

    // Consolidate permissions by function
    accessPatterns.functions.forEach(({ functionName, permissions }) => {
      if (!consolidatedFunctions[functionName]) {
        consolidatedFunctions[functionName] = new Set(permissions);
      } else {
        // Merge permissions
        permissions.forEach((p) => consolidatedFunctions[functionName].add(p));
      }
    });

    // Add function access to all three default paths
    Object.entries(consolidatedFunctions).forEach(([functionName, permissions]) => {
      const resourcePattern = createResourcePattern(allowIdentifier, functionName, Array.from(permissions));
      publicPathAccess.push(resourcePattern);
      privatePathAccess.push(resourcePattern);
      protectedPathAccess.push(resourcePattern);
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

  // Add function-specific path access patterns (removed - functions now go in default paths)

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
