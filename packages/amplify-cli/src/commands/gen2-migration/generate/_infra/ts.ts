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
   * Prints a TypeScript AST node array to a formatted string.
   */
  public static printNodes(nodes: ts.NodeArray<ts.Node>): string {
    const raw = printer.printList(ts.ListFormat.MultiLine, nodes, sourceFile);
    return prettier.format(raw, {
      parser: 'typescript',
      singleQuote: true,
      tabWidth: 2,
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
  public static constDecl(name: string, initializer: ts.Expression): ts.VariableStatement {
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
    return TS.constDecl(name, TS.propAccess('backend', ...path));
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
    return TS.constDecl('branchName', factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'));
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
