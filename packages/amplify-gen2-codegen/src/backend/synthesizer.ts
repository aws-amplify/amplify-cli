import ts, {
  Node,
  ExpressionStatement,
  CallExpression,
  Expression,
  VariableDeclaration,
  Identifier,
  NodeArray,
  ImportDeclaration,
  VariableStatement,
} from 'typescript';
import { PolicyOverrides } from '../auth/source_builder.js';
const factory = ts.factory;
export interface BackendRenderParameters {
  data?: {
    importFrom: string;
  };
  auth?: {
    importFrom: string;
    userPoolOverrides?: PolicyOverrides;
    guestLogin?: boolean;
    oAuthFlows?: string[];
    readAttributes?: string[];
    writeAttributes?: string[];
  };
  storage?: {
    importFrom: string;
  };
  function?: {
    importFrom: string;
    functionNamesAndCategories: Map<string, string>;
  };
  unsupportedCategories?: {
    categories?: string[];
  };
}

export class BackendSynthesizer {
  private createPropertyAccessExpression(propertyPath: string): Expression {
    const parts = propertyPath.split('.');
    let expression: Expression = factory.createIdentifier(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      expression = factory.createPropertyAccessExpression(expression, factory.createIdentifier(parts[i]));
    }
    return expression;
  }

  private createVariableDeclaration(identifierName: string, propertyPath: string): VariableDeclaration {
    const identifier = factory.createIdentifier(identifierName);
    const propertyAccessExpression = this.createPropertyAccessExpression(propertyPath);
    return factory.createVariableDeclaration(identifier, undefined, undefined, propertyAccessExpression);
  }

  private createVariableStatement(variableDeclaration: VariableDeclaration): VariableStatement {
    return factory.createVariableStatement([], factory.createVariableDeclarationList([variableDeclaration], ts.NodeFlags.Const));
  }

  private createImportStatement(identifiers: Identifier[], backendPackageName: string): ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports(identifiers.map((identifier) => factory.createImportSpecifier(false, undefined, identifier))),
      ),
      factory.createStringLiteral(backendPackageName),
    );
  }

  private defineBackendCall(backendFunctionIdentifier: Identifier, properties: ts.ObjectLiteralElementLike[]): CallExpression {
    const backendFunctionArgs = factory.createObjectLiteralExpression(properties, true);
    return factory.createCallExpression(backendFunctionIdentifier, undefined, [backendFunctionArgs]);
  }

  private createOverrideStatement(
    objectIdentifier: Identifier,
    propertyName: string,
    value: number | string | boolean | string[],
  ): ExpressionStatement {
    const addOverrideIdentifier = factory.createIdentifier('addPropertyOverride');
    const overrideValue = this.getOverrideValue(value);

    return factory.createExpressionStatement(
      factory.createCallExpression(factory.createPropertyAccessExpression(objectIdentifier, addOverrideIdentifier), undefined, [
        factory.createStringLiteral(propertyName),
        overrideValue,
      ]),
    );
  }

  private getOverrideValue(value: number | string | boolean | string[]): Expression {
    if (typeof value === 'number') {
      return factory.createNumericLiteral(value);
    } else if (typeof value === 'string') {
      return factory.createStringLiteral(value);
    } else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return factory.createArrayLiteralExpression(value.map((item) => factory.createStringLiteral(item)));
    } else if (typeof value === 'boolean') {
      return value ? factory.createTrue() : factory.createFalse();
    }
    throw new TypeError(`Unrecognized type: ${typeof value}`);
  }

  render(renderArgs: BackendRenderParameters): NodeArray<Node> {
    const authFunctionIdentifier = factory.createIdentifier('auth');
    const storageFunctionIdentifier = factory.createIdentifier('storage');
    const dataFunctionIdentifier = factory.createIdentifier('data');
    const backendFunctionIdentifier = factory.createIdentifier('defineBackend');

    const imports = [];
    const errors = [];
    const defineBackendProperties = [];
    const nodes = [];

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

    if (renderArgs.function) {
      const functionIdentifiers: Identifier[] = [];

      const functionNameCategories = renderArgs.function.functionNamesAndCategories;
      for (const [functionName, category] of functionNameCategories) {
        functionIdentifiers.push(factory.createIdentifier(functionName));
        const functionProperty = factory.createShorthandPropertyAssignment(factory.createIdentifier(functionName));
        defineBackendProperties.push(functionProperty);
        imports.push(this.createImportStatement([factory.createIdentifier(functionName)], `./${category}/${functionName}/resource`));
      }
    }

    imports.push(this.createImportStatement([backendFunctionIdentifier], '@aws-amplify/backend'));

    if (renderArgs.unsupportedCategories && renderArgs.unsupportedCategories.categories) {
      const categories = renderArgs.unsupportedCategories.categories;
      console.log('unsupported categories -- ', categories);
      errors.push(
        factory.createCallExpression(factory.createIdentifier('throw new Error'), undefined, [
          // eslint-disable-next-line spellcheck/spell-checker
          factory.createStringLiteral(`Categories ${categories.join(', ')} are unsupported`),
        ]),
      );
    }

    const callBackendFn = this.defineBackendCall(backendFunctionIdentifier, defineBackendProperties);
    const backendVariable = factory.createVariableDeclaration('backend', undefined, undefined, callBackendFn);
    const backendStatement = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([backendVariable], ts.NodeFlags.Const),
    );

    if (renderArgs.auth?.userPoolOverrides) {
      const cfnUserPoolVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnUserPool', 'backend.auth.resources.cfnResources.cfnUserPool'),
      );
      nodes.push(cfnUserPoolVariableStatement);
      for (const [overridePath, value] of Object.entries(renderArgs.auth.userPoolOverrides)) {
        nodes.push(this.createOverrideStatement(factory.createIdentifier('cfnUserPool'), overridePath, value as number | string | boolean));
      }
    }

    if (renderArgs.auth?.guestLogin === false) {
      const cfnIdentityPoolVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnIdentityPool', 'backend.auth.resources.cfnResources.cfnIdentityPool'),
      );
      nodes.push(cfnIdentityPoolVariableStatement);
      nodes.push(this.createOverrideStatement(factory.createIdentifier('cfnIdentityPool'), 'AllowUnauthenticatedIdentities', false));
    }

    if (renderArgs.auth?.oAuthFlows || renderArgs.auth?.readAttributes || renderArgs.auth?.writeAttributes) {
      const cfnUserPoolClientVariableStatement = this.createVariableStatement(
        this.createVariableDeclaration('cfnUserPoolClient', 'backend.auth.resources.cfnResources.cfnUserPoolClient'),
      );
      nodes.push(cfnUserPoolClientVariableStatement);
      if (renderArgs.auth?.oAuthFlows) {
        nodes.push(
          this.createOverrideStatement(
            factory.createIdentifier('cfnUserPoolClient'),
            'AllowedOAuthFlows',
            renderArgs.auth?.oAuthFlows as number | string | boolean | string[],
          ),
        );
      }
      if (renderArgs.auth?.readAttributes) {
        nodes.push(
          this.createOverrideStatement(
            factory.createIdentifier('cfnUserPoolClient'),
            'ReadAttributes',
            renderArgs.auth?.readAttributes as number | string | boolean | string[],
          ),
        );
      }
    }
    if (renderArgs.auth?.writeAttributes) {
      nodes.push(
        this.createOverrideStatement(
          factory.createIdentifier('cfnUserPoolClient'),
          'WriteAttributes',
          renderArgs.auth?.writeAttributes as string[],
        ),
      );
    }
    return factory.createNodeArray([...imports, ...errors, backendStatement, ...nodes], true);
  }
}
