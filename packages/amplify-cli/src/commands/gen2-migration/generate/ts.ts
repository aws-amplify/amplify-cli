import ts from 'typescript';
import * as prettier from 'prettier';

const factory = ts.factory;
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('output.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

export const newLineIdentifier = factory.createIdentifier('\n');

/**
 * Parameters for rendering a single-export resource.ts file.
 */
export type ResourceTsParameters = {
  readonly additionalImportedBackendIdentifiers?: Readonly<Record<string, Set<string>>>;
  readonly backendFunctionConstruct: string;
  readonly functionCallParameter: ts.ObjectLiteralExpression;
  readonly exportedVariableName: ts.Identifier;
  readonly postImportStatements?: readonly ts.Node[];
  readonly postExportStatements?: readonly ts.Node[];
};

/**
 * TypeScript AST utilities for code generation.
 *
 * Combines AST node builders and printing into a single static utility class.
 */
export class TS {
  /**
   * Asserts that `name` is a valid JavaScript identifier before it is
   * interpolated verbatim into generated source (e.g. `backend.${name}.resources.lambda`).
   * Amplify resource names are expected to be identifier-safe, but an unexpected
   * name containing hyphens/dots/spaces would emit invalid TypeScript; failing
   * loudly at generate time is preferable to writing a file that won't compile.
   * `context` names the interpolation site for the error message.
   */
  public static assertValidIdentifier(name: string, context: string): void {
    // Matches a standard JS identifier (letter/underscore/$ start; the standard
    // Unicode identifier ranges are not needed for Amplify resource names).
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
      throw new Error(`Cannot generate ${context}: '${name}' is not a valid JavaScript identifier and would produce invalid TypeScript.`);
    }
  }

  /**
   * Prints a TypeScript AST node array to a formatted string.
   */
  public static printNodes(nodes: ts.NodeArray<ts.Node>, printWidth?: number): string {
    const raw = printer.printList(ts.ListFormat.MultiLine, nodes, sourceFile);
    return prettier.format(raw, {
      parser: 'typescript',
      singleQuote: true,
      tabWidth: 2,
      ...(printWidth !== undefined && { printWidth }),
    });
  }

  /**
   * Prints a single TypeScript AST node to a string.
   */
  public static printNode(node: ts.Node): string {
    return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
  }

  /**
   * Creates `const {name} = {initializer};`
   */
  public static declareConst(name: string, initializer: ts.Expression): ts.VariableStatement {
    return factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [factory.createVariableDeclaration(name, undefined, undefined, initializer)],
        ts.NodeFlags.Const,
      ),
    );
  }

  /**
   * Creates a chained property access expression: `root.a.b.c`
   */
  public static propAccess(root: string | ts.Expression, ...segments: string[]): ts.Expression {
    let expr: ts.Expression = typeof root === 'string' ? factory.createIdentifier(root) : root;
    for (const segment of segments) {
      expr = factory.createPropertyAccessExpression(expr, factory.createIdentifier(segment));
    }
    return expr;
  }

  /**
   * Creates `const {name} = backend.{...path};`
   */
  public static constFromBackend(name: string, ...path: string[]): ts.VariableStatement {
    return TS.declareConst(name, TS.propAccess('backend', ...path));
  }

  /**
   * Creates `import { a, b } from 'source';`
   */
  public static namedImport(source: string, ...identifiers: string[]): ts.ImportDeclaration {
    const specifiers = identifiers.map((id) => factory.createImportSpecifier(false, undefined, factory.createIdentifier(id)));
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamedImports(specifiers)),
      factory.createStringLiteral(source),
    );
  }

  /**
   * Creates `import type { a, b } from 'source';`
   */
  public static typeImport(source: string, ...identifiers: string[]): ts.ImportDeclaration {
    const specifiers = identifiers.map((id) => factory.createImportSpecifier(false, undefined, factory.createIdentifier(id)));
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(true, undefined, factory.createNamedImports(specifiers)),
      factory.createStringLiteral(source),
    );
  }

  /**
   * Creates `import * as alias from 'source';`
   */
  public static namespaceImport(alias: string, source: string): ts.ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier(alias))),
      factory.createStringLiteral(source),
    );
  }

  /**
   * Creates `(expr as Type).prop = value;` as an expression statement.
   */
  public static castAssign(expr: ts.Expression, typeName: string, prop: string, value: ts.Expression): ts.ExpressionStatement {
    return factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(
          factory.createParenthesizedExpression(factory.createAsExpression(expr, factory.createTypeReferenceNode(typeName))),
          factory.createIdentifier(prop),
        ),
        value,
      ),
    );
  }

  /**
   * Creates `factory.createPropertyAssignment('key', factory.createStringLiteral('value'))`.
   */
  public static stringProp(key: string, value: string): ts.PropertyAssignment {
    return factory.createPropertyAssignment(factory.createIdentifier(key), factory.createStringLiteral(value));
  }

  /**
   * Creates `factory.createPropertyAssignment('key', Enum.VALUE)`.
   */
  public static enumProp(key: string, enumName: string, value: string): ts.PropertyAssignment {
    return factory.createPropertyAssignment(
      factory.createIdentifier(key),
      factory.createPropertyAccessExpression(factory.createIdentifier(enumName), factory.createIdentifier(value)),
    );
  }

  /**
   * Creates an exported function: `export function name(backend: Backend, ...extraParams) { ...body }`
   */
  public static exportedFunction(
    name: string,
    body: readonly ts.Statement[],
    extraParams?: readonly ts.ParameterDeclaration[],
  ): ts.FunctionDeclaration {
    const params: ts.ParameterDeclaration[] = [
      factory.createParameterDeclaration(undefined, undefined, 'backend', undefined, factory.createTypeReferenceNode('Backend')),
      ...(extraParams ?? []),
    ];
    return factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      name,
      undefined,
      params,
      undefined,
      factory.createBlock([...body], true),
    );
  }

  /**
   * Creates `{target}.{property} = {value};` as an expression statement.
   */
  public static assignProp(
    target: string,
    property: string,
    value: number | string | boolean | string[] | object | undefined,
  ): ts.ExpressionStatement {
    return factory.createExpressionStatement(
      factory.createAssignment(
        factory.createPropertyAccessExpression(factory.createIdentifier(target), factory.createIdentifier(property)),
        TS.jsValue(value),
      ),
    );
  }

  /**
   * Converts a JavaScript value to a TypeScript AST expression.
   */
  public static jsValue(value: number | string | boolean | string[] | object | undefined): ts.Expression {
    if (value === undefined) return factory.createIdentifier('undefined');
    if (typeof value === 'boolean') return value ? factory.createTrue() : factory.createFalse();
    if (typeof value === 'number') return factory.createNumericLiteral(value);
    if (typeof value === 'string') return factory.createStringLiteral(value);
    if (Array.isArray(value)) return factory.createArrayLiteralExpression(value.map((v) => factory.createStringLiteral(v)));
    if (typeof value === 'object') {
      const props = Object.entries(value).map(([key, val]) =>
        factory.createPropertyAssignment(key, TS.jsValue(val as number | string | boolean | string[] | object | undefined)),
      );
      return factory.createObjectLiteralExpression(props, true);
    }
    return factory.createIdentifier('undefined');
  }

  /**
   * Creates a `const branchName = process.env.AWS_BRANCH ?? "sandbox"` AST node.
   */
  public static createBranchNameDeclaration(): ts.VariableStatement {
    return TS.declareConst('branchName', factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'));
  }

  /**
   * Creates a for-of loop that applies DeletionPolicy/UpdateReplacePolicy Retain overrides to matching CfnResources.
   */
  public static retentionLoop(stackNodeExpr: ts.Expression, types: readonly string[]): ts.ForOfStatement {
    const cfnResourceId = factory.createIdentifier('cfnResource');
    const isCfnResourceCall = factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('CfnResource'), factory.createIdentifier('isCfnResource')),
      undefined,
      [factory.createIdentifier('c')],
    );

    let filterCondition: ts.Expression;
    if (types.length === 1) {
      filterCondition = factory.createBinaryExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('c'), factory.createIdentifier('cfnResourceType')),
        ts.SyntaxKind.EqualsEqualsEqualsToken,
        factory.createStringLiteral(types[0]),
      );
    } else {
      filterCondition = factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createArrayLiteralExpression(types.map((t) => factory.createStringLiteral(t))),
          factory.createIdentifier('includes'),
        ),
        undefined,
        [factory.createPropertyAccessExpression(factory.createIdentifier('c'), factory.createIdentifier('cfnResourceType'))],
      );
    }

    const combinedCondition = factory.createBinaryExpression(isCfnResourceCall, ts.SyntaxKind.AmpersandAmpersandToken, filterCondition);

    const filterCallback = factory.createArrowFunction(
      undefined,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, 'c')],
      undefined,
      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      combinedCondition,
    );

    const iterableExpr = factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(stackNodeExpr, factory.createIdentifier('findAll')),
          undefined,
          [],
        ),
        factory.createIdentifier('filter'),
      ),
      undefined,
      [filterCallback],
    );

    const updateOverride = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createParenthesizedExpression(factory.createAsExpression(cfnResourceId, factory.createTypeReferenceNode('CfnResource'))),
          factory.createIdentifier('addOverride'),
        ),
        undefined,
        [factory.createStringLiteral('UpdateReplacePolicy'), factory.createStringLiteral('Retain')],
      ),
    );

    const deletionOverride = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createParenthesizedExpression(factory.createAsExpression(cfnResourceId, factory.createTypeReferenceNode('CfnResource'))),
          factory.createIdentifier('addOverride'),
        ),
        undefined,
        [factory.createStringLiteral('DeletionPolicy'), factory.createStringLiteral('Retain')],
      ),
    );

    return factory.createForOfStatement(
      undefined,
      factory.createVariableDeclarationList([factory.createVariableDeclaration(cfnResourceId)], ts.NodeFlags.Const),
      iterableExpr,
      factory.createBlock([updateOverride, deletionOverride], true),
    );
  }

  /**
   * Extracts the file path from an AWS Lambda handler string.
   * 'index.handler' → './index.js', 'src/handler.myFunction' → './src/handler.js'
   */
  public static extractFilePathFromHandler(handler: string): string {
    const lastDotIndex = handler.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return `./${handler}.js`;
    }
    return `./${handler.substring(0, lastDotIndex)}.js`;
  }
  /**
   * Parameters for rendering a single-export resource.ts file.
   */
  public static renderResourceTsFile({
    additionalImportedBackendIdentifiers = {},
    backendFunctionConstruct,
    functionCallParameter,
    exportedVariableName,
    postImportStatements,
    postExportStatements,
  }: ResourceTsParameters): ts.NodeArray<ts.Node> {
    const backendFunctionIdentifier = factory.createIdentifier(backendFunctionConstruct);
    const importStatements = TS.renderImportStatements(additionalImportedBackendIdentifiers);
    const functionCall = factory.createCallExpression(backendFunctionIdentifier, undefined, [functionCallParameter]);
    const exportedVariable = factory.createVariableDeclaration(exportedVariableName, undefined, undefined, functionCall);
    const exportStatement = factory.createVariableStatement(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList([exportedVariable], ts.NodeFlags.Const),
    );

    return factory.createNodeArray([
      ...importStatements,
      ...(postImportStatements !== undefined && postImportStatements.length > 0 ? [newLineIdentifier, ...postImportStatements] : []),
      newLineIdentifier,
      exportStatement,
      ...(postExportStatements !== undefined && postExportStatements.length > 0 ? [newLineIdentifier, ...postExportStatements] : []),
    ]);
  }

  private static renderImportStatements(additionalImportedBackendIdentifiers: Record<string, Set<string>>): ts.ImportDeclaration[] {
    const importStatements: ts.ImportDeclaration[] = [];
    for (const [packageName, identifiers] of Object.entries(additionalImportedBackendIdentifiers)) {
      const importSpecifiers: ts.ImportSpecifier[] = [];
      identifiers.forEach((identifier) => {
        importSpecifiers.push(factory.createImportSpecifier(false, undefined, factory.createIdentifier(identifier)));
      });
      importStatements.push(
        factory.createImportDeclaration(
          undefined,
          factory.createImportClause(false, undefined, factory.createNamedImports(importSpecifiers)),
          factory.createStringLiteral(packageName),
        ),
      );
    }
    return importStatements;
  }
}
