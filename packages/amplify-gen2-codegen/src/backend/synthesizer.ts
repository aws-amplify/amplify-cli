import ts, { Expression, VariableDeclaration, Identifier, Node } from 'typescript';
import { UserPoolOverrides } from '../auth/source_builder.js';
const factory = ts.factory;
export interface BackendRenderParameters {
  data?: {
    importFrom: string;
  };
  auth?: {
    importFrom: string;
    userPoolOverrides?: UserPoolOverrides;
    guestLogin?: boolean;
    oAuthFlows?: string[];
  };
  storage?: {
    importFrom: string;
  };
}

export class BackendSynthesizer {
  private createPropertyAccessExpression(propertyPath: string) {
    const parts = propertyPath.split('.');
    let expression: Expression = factory.createIdentifier(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(parts[i]));
    }
    return expression;
  }

  private createVariableDeclaration(identifierName: string, propertyPath: string) {
    const identifier = factory.createIdentifier(identifierName);
    const propertyAccessExpression = this.createPropertyAccessExpression(propertyPath);
    return factory.createVariableDeclaration(identifier, undefined, undefined, propertyAccessExpression);
  }

  private createVariableStatement(variableDeclaration: VariableDeclaration) {
    return factory.createVariableStatement([], factory.createVariableDeclarationList([variableDeclaration], ts.NodeFlags.Const));
  }

  private createImportStatement = (identifiers: Identifier[], backendPackageName: string) => {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports(identifiers.map((identifier) => factory.createImportSpecifier(false, undefined, identifier))),
      ),
      factory.createStringLiteral(backendPackageName),
    );
  };
  private defineBackendCall = (backendFunctionIdentifier: Identifier, properties: ts.ObjectLiteralElementLike[]): ts.CallExpression => {
    const backendFunctionArgs = factory.createObjectLiteralExpression(properties, true);
    return factory.createCallExpression(backendFunctionIdentifier, undefined, [backendFunctionArgs]);
  };
  render = (renderArgs: BackendRenderParameters): ts.NodeArray<Node> => {
    const authFunctionIdentifier = factory.createIdentifier('auth');
    const storageFunctionIdentifier = factory.createIdentifier('storage');
    const dataFunctionIdentifier = factory.createIdentifier('data');

    const backendFunctionIdentifier = factory.createIdentifier('defineBackend');
    const imports = [];
    const defineBackendProperties = [];
    if (renderArgs.auth) {
      imports.push(this.createImportStatement([authFunctionIdentifier], renderArgs.auth.importFrom));
      const auth = factory.createShorthandPropertyAssignment(authFunctionIdentifier);
      defineBackendProperties.push(auth);
    }
    if (renderArgs.data) {
      imports.push(this.createImportStatement([dataFunctionIdentifier], renderArgs.data.importFrom));
      const data = factory.createShorthandPropertyAssignment(dataFunctionIdentifier);
      defineBackendProperties.push(data);
    }
    if (renderArgs.storage) {
      imports.push(this.createImportStatement([storageFunctionIdentifier], renderArgs.storage.importFrom));
      const storage = factory.createShorthandPropertyAssignment(storageFunctionIdentifier);
      defineBackendProperties.push(storage);
    }
    imports.push(this.createImportStatement([backendFunctionIdentifier], '@aws-amplify/backend'));
    const callBackendFn = this.defineBackendCall(backendFunctionIdentifier, defineBackendProperties);
    const backendVariable = factory.createVariableDeclaration('backend', undefined, undefined, callBackendFn);
    const backendStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([backendVariable], ts.NodeFlags.Const),
    );
    const userPoolOverrides = [];
    const cfnUserPoolVariableDeclaration = this.createVariableDeclaration('cfnUserPool', 'backend.auth.resources.cfnResources.cfnUserPool');
    const cfnUserPoolVariableStatement = this.createVariableStatement(cfnUserPoolVariableDeclaration);
    const getOverrideValue = (value: number | string | boolean | string[]) => {
      if (typeof value === 'number') {
        return factory.createNumericLiteral(value);
      } else if (typeof value === 'string') {
        return factory.createStringLiteral(value);
      } else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
        return factory.createArrayLiteralExpression(value.map((item) => factory.createStringLiteral(item)));
      } else if (typeof value === 'boolean') {
        if (value) {
          return factory.createTrue();
        } else {
          return factory.createFalse();
        }
      }
      throw new TypeError(`unrecognized type: ${typeof value}`);
    };

    const guestlogin = [];
    const cfnIdentityPoolVariableDeclaration = this.createVariableDeclaration(
      'cfnIdentityPool',
      'backend.auth.resources.cfnResources.cfnIdentityPool',
    );
    const cfnIdentityPoolVariableStatement = this.createVariableStatement(cfnIdentityPoolVariableDeclaration);

    const cfnUserPoolClientvariableStatement = this.createVariableStatement(
      this.createVariableDeclaration('cfnUserPoolClient', 'backend.auth.resources.cfnResources.cfnUserPoolClient'),
    );

    if (renderArgs.auth?.userPoolOverrides) {
      userPoolOverrides.push(cfnUserPoolVariableStatement);
      const addOverrideIdentifier = factory.createIdentifier('addPropertyOverride');
      for (const [overridePath, value] of Object.entries(renderArgs.auth.userPoolOverrides)) {
        userPoolOverrides.push(
          factory.createExpressionStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('cfnUserPool'), addOverrideIdentifier),
              undefined,
              [factory.createStringLiteral(overridePath), getOverrideValue(value as number | string | boolean)],
            ),
          ),
        );
      }
    }
    if (!renderArgs.auth?.guestLogin) {
      const addOverrideIdentifier = factory.createIdentifier('addPropertyOverride');
      guestlogin.push(cfnIdentityPoolVariableStatement);
      guestlogin.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('cfnIdentityPool'), addOverrideIdentifier),
            undefined,
            [
              factory.createStringLiteral('AllowUnauthenticatedIdentities'),
              getOverrideValue(renderArgs.auth?.guestLogin as number | string | boolean),
            ],
          ),
        ),
        // factory.createExpressionStatement(
        //   factory.createBinaryExpression(
        //     factory.createPropertyAccessExpression(
        //       factory.createIdentifier('cfnIdentityPool'),
        //       factory.createIdentifier('allowUnauthenticatedIdentities')
        //     ),
        //     factory.createToken(ts.SyntaxKind.EqualsToken),
        //     factory.createFalse(),
        //   ),
        // ),
      );
    }
    if (renderArgs.auth?.oAuthFlows) {
      const addOverrideIdentifier = factory.createIdentifier('addPropertyOverride');
      guestlogin.push(cfnUserPoolClientvariableStatement);
      guestlogin.push(
        factory.createExpressionStatement(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier('cfnUserPoolClient'), addOverrideIdentifier),
            undefined,
            [
              factory.createStringLiteral('AllowedOAuthFlows'),
              getOverrideValue(renderArgs.auth?.oAuthFlows as number | string | boolean | string[]),
            ],
          ),
        ),
      );
    }
    return factory.createNodeArray([...imports, backendStatement, ...guestlogin, ...userPoolOverrides], true);
  };
}
