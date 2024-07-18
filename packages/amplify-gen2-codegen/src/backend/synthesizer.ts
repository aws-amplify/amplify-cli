import ts, { Identifier, Node } from 'typescript';
import { UserPoolOverrides } from '../auth/source_builder.js';
const factory = ts.factory;
export interface BackendRenderParameters {
  auth?: {
    importFrom: string;
    userPoolOverrides?: UserPoolOverrides;
  };
  storage?: {
    importFrom: string;
  };
}

export class BackendSynthesizer {
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
  private defineBackendCall = (backendFunctionIdentifier: Identifier, properties: ts.PropertyAssignment[]): ts.CallExpression => {
    const backendFunctionArgs = factory.createObjectLiteralExpression(properties, true);
    return factory.createCallExpression(backendFunctionIdentifier, undefined, [backendFunctionArgs]);
  };
  render = (renderArgs: BackendRenderParameters): ts.NodeArray<Node> => {
    const authFunctionIdentifier = factory.createIdentifier('auth');
    const storageFunctionIdentifier = factory.createIdentifier('storage');

    const backendFunctionIdentifier = factory.createIdentifier('defineBackend');
    const imports = [];
    const defineBackendProperties = [];
    if (renderArgs.auth) {
      imports.push(this.createImportStatement([authFunctionIdentifier], renderArgs.auth.importFrom));
      const auth = factory.createPropertyAssignment('auth', authFunctionIdentifier);
      defineBackendProperties.push(auth);
    }
    if (renderArgs.storage) {
      imports.push(this.createImportStatement([storageFunctionIdentifier], renderArgs.storage.importFrom));
      const storage = factory.createPropertyAssignment('storage', storageFunctionIdentifier);
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
    const cfnUserPoolIdentifier = factory.createIdentifier('cfnUserPool');
    const cfnUserPoolVariable = factory.createVariableDeclaration(
      cfnUserPoolIdentifier,
      undefined,
      undefined,
      factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('auth')),
        factory.createIdentifier('resources.cfnResources.cfnUserPool'),
      ),
    );
    const cfnUserPoolVariableStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([cfnUserPoolVariable], ts.NodeFlags.Const),
    );
    const getOverrideValue = (value: number | string | boolean) => {
      if (typeof value === 'number') {
        return factory.createNumericLiteral(value);
      } else if (typeof value === 'string') {
        return factory.createStringLiteral(value);
      } else if (typeof value === 'boolean') {
        if (value) {
          return factory.createTrue();
        } else {
          return factory.createFalse();
        }
      }
      throw new TypeError(`unrecognized type: ${typeof value}`);
    };
    if (renderArgs.auth?.userPoolOverrides) {
      userPoolOverrides.push(cfnUserPoolVariableStatement);
      const addOverrideIdentifier = factory.createIdentifier('addPropertyOverride');
      for (const [overridePath, value] of Object.entries(renderArgs.auth.userPoolOverrides)) {
        userPoolOverrides.push(
          factory.createExpressionStatement(
            factory.createCallExpression(factory.createPropertyAccessExpression(cfnUserPoolIdentifier, addOverrideIdentifier), undefined, [
              factory.createStringLiteral(overridePath),
              getOverrideValue(value as number | string | boolean),
            ]),
          ),
        );
      }
    }
    return factory.createNodeArray([...imports, backendStatement, ...userPoolOverrides], true);
  };
}
