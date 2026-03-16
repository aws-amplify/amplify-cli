import ts from 'typescript';
import { newLineIdentifier } from '../../ts_factory_utils';
import { GeoResourceRenderParameters } from './index';

const factory = ts.factory;

// Helper to create backend.auth.resources.authenticatedUserIamRole.roleName
const createAuthRoleAccess = () =>
  factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
        factory.createIdentifier('resources'),
      ),
      factory.createIdentifier('authenticatedUserIamRole'),
    ),
    factory.createIdentifier('roleName'),
  );

// Helper to create backend.auth.resources.unauthenticatedUserIamRole.roleName
const createUnauthRoleAccess = () =>
  factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
        factory.createIdentifier('resources'),
      ),
      factory.createIdentifier('unauthenticatedUserIamRole'),
    ),
    factory.createIdentifier('roleName'),
  );

// Helper to create backend.auth.resources.userPool.userPoolId
const createUserPoolIdAccess = () =>
  factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
        factory.createIdentifier('resources'),
      ),
      factory.createIdentifier('userPool'),
    ),
    factory.createIdentifier('userPoolId'),
  );

// Helper to create backend.auth.resources.groups['groupName'].role.roleName
const createGroupRoleAccess = (groupName: string) =>
  factory.createPropertyAccessExpression(
    factory.createPropertyAccessExpression(
      factory.createElementAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
            factory.createIdentifier('resources'),
          ),
          factory.createIdentifier('groups'),
        ),
        factory.createStringLiteral(groupName),
      ),
      factory.createIdentifier('role'),
    ),
    factory.createIdentifier('roleName'),
  );

// Builds the service-specific static props based on serviceName
const getStaticProps = (params: GeoResourceRenderParameters): ts.PropertyAssignment[] => {
  switch (params.serviceName) {
    case 'Map':
      return [
        factory.createPropertyAssignment(factory.createIdentifier('mapName'), factory.createStringLiteral(params.mapName)),
        factory.createPropertyAssignment(factory.createIdentifier('mapStyle'), factory.createStringLiteral(params.mapStyle)),
      ];
    case 'PlaceIndex':
      return [
        factory.createPropertyAssignment(factory.createIdentifier('indexName'), factory.createStringLiteral(params.indexName)),
        factory.createPropertyAssignment(factory.createIdentifier('dataProvider'), factory.createStringLiteral(params.dataProvider)),
        factory.createPropertyAssignment(
          factory.createIdentifier('dataSourceIntendedUse'),
          factory.createStringLiteral(params.dataSourceIntendedUse),
        ),
      ];
    case 'GeofenceCollection':
      return [
        factory.createPropertyAssignment(factory.createIdentifier('collectionName'), factory.createStringLiteral(params.collectionName)),
      ];
    default: {
      const _exhaustiveCheck: never = params;
      throw new Error(`Unsupported geo service type: ${(_exhaustiveCheck as GeoResourceRenderParameters).serviceName}`);
    }
  }
};

/**
 * Renders a per-resource geo resource.ts file.
 *
 * Generated output example (Map):
 * ```typescript
 * import { GeoMyMap } from './myMap-construct';
 * import { Backend } from '@aws-amplify/backend';
 *
 * const branchName = process.env.AWS_BRANCH ?? 'sandbox';
 *
 * export const defineMyMap = (backend: Backend<any>) => {
 *   const myMapStack = backend.createStack('myMap');
 *   const myMap = new GeoMyMap(myMapStack, 'myMap', {
 *     authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
 *     unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
 *     authMyAuthUserPoolId: backend.auth.resources.userPool.userPoolId,
 *     authuserPoolGroupsAdminGroupRole: backend.auth.resources.groups['Admin'].role.roleName,
 *     mapName: 'myMap',
 *     mapStyle: 'VectorEsriStreets',
 *     branchName,
 *     isDefault: 'true',
 *   });
 *   return myMap;
 * };
 * ```
 *
 * Generated output example (PlaceIndex):
 * ```typescript
 * import { GeoMySearch } from './mySearch-construct';
 * import { Backend } from '@aws-amplify/backend';
 *
 * const branchName = process.env.AWS_BRANCH ?? 'sandbox';
 *
 * export const defineMySearch = (backend: Backend<any>) => {
 *   const mySearchStack = backend.createStack('mySearch');
 *   const mySearch = new GeoMySearch(mySearchStack, 'mySearch', {
 *     authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
 *     unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
 *     authMyAuthUserPoolId: backend.auth.resources.userPool.userPoolId,
 *     authuserPoolGroupsAdminGroupRole: backend.auth.resources.groups['Admin'].role.roleName,
 *     indexName: 'mySearch',
 *     dataProvider: 'Esri',
 *     dataSourceIntendedUse: 'SingleUse',
 *     branchName,
 *     isDefault: 'true',
 *   });
 *   return mySearch;
 * };
 * ```
 *
 * Generated output example (GeofenceCollection - no authRoleName/unauthRoleName):
 * ```typescript
 * import { GeoMyGeofence } from './myGeofence-construct';
 * import { Backend } from '@aws-amplify/backend';
 *
 * const branchName = process.env.AWS_BRANCH ?? 'sandbox';
 *
 * export const defineMyGeofence = (backend: Backend<any>) => {
 *   const myGeofenceStack = backend.createStack('myGeofence');
 *   const myGeofence = new GeoMyGeofence(myGeofenceStack, 'myGeofence', {
 *     authMyAuthUserPoolId: backend.auth.resources.userPool.userPoolId,
 *     authuserPoolGroupsAdminGroupRole: backend.auth.resources.groups['Admin'].role.roleName,
 *     collectionName: 'myGeofence',
 *     branchName,
 *     isDefault: 'true',
 *   });
 *   return myGeofence;
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Using 'any' for generated code Backend<any> type
export const renderGeoResource = (params: GeoResourceRenderParameters): ts.NodeArray<ts.Node> => {
  const { constructClassName, constructFileName, resourceName } = params;

  const constructImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier(constructClassName))]),
    ),
    factory.createStringLiteral(`./${constructFileName}`),
  );

  const backendImport = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('Backend'))]),
    ),
    factory.createStringLiteral('@aws-amplify/backend'),
  );

  const branchNameConst = factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          'branchName',
          undefined,
          undefined,
          factory.createBinaryExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('process'), factory.createIdentifier('env')),
              factory.createIdentifier('AWS_BRANCH'),
            ),
            factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
            factory.createStringLiteral('sandbox'),
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );

  const createStackCall = factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          `${resourceName}Stack`,
          undefined,
          undefined,
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('createStack')),
            undefined,
            [factory.createStringLiteral(resourceName)],
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );

  const constructProps: ts.ObjectLiteralElementLike[] = [];

  if (params.serviceName === 'Map' || params.serviceName === 'PlaceIndex') {
    constructProps.push(factory.createPropertyAssignment(factory.createIdentifier('authRoleName'), createAuthRoleAccess()));
    constructProps.push(factory.createPropertyAssignment(factory.createIdentifier('unauthRoleName'), createUnauthRoleAccess()));
  }

  if (params.userPoolIdParamName) {
    constructProps.push(factory.createPropertyAssignment(factory.createIdentifier(params.userPoolIdParamName), createUserPoolIdAccess()));
  }

  for (const groupRole of params.groupRoles) {
    constructProps.push(
      factory.createPropertyAssignment(factory.createIdentifier(groupRole.paramName), createGroupRoleAccess(groupRole.groupName)),
    );
  }

  constructProps.push(...getStaticProps(params));
  constructProps.push(factory.createShorthandPropertyAssignment(factory.createIdentifier('branchName')));
  constructProps.push(
    factory.createPropertyAssignment(factory.createIdentifier('isDefault'), factory.createStringLiteral(params.isDefault)),
  );

  const constructInstantiation = factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          resourceName,
          undefined,
          undefined,
          factory.createNewExpression(factory.createIdentifier(constructClassName), undefined, [
            factory.createIdentifier(`${resourceName}Stack`),
            factory.createStringLiteral(resourceName),
            factory.createObjectLiteralExpression(constructProps, true),
          ]),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );

  const returnStatement = factory.createReturnStatement(factory.createIdentifier(resourceName));

  const functionName = `define${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1)}`;
  const arrowFunction = factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier('backend'),
        undefined,
        factory.createTypeReferenceNode(factory.createIdentifier('Backend'), [factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)]),
      ),
    ],
    undefined,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    factory.createBlock([createStackCall, constructInstantiation, returnStatement], true),
  );

  const exportStatement = factory.createVariableStatement(
    [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier(functionName), undefined, undefined, arrowFunction)],
      ts.NodeFlags.Const,
    ),
  );

  return factory.createNodeArray([constructImport, backendImport, newLineIdentifier, branchNameConst, newLineIdentifier, exportStatement]);
};
