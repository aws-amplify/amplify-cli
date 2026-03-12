import ts from 'typescript';

const factory = ts.factory;

export const newLineIdentifier = factory.createIdentifier('\n');

// ── Compound AST builders ──────────────────────────────────────────
// These reduce the boilerplate of creating common TypeScript AST
// patterns that appear repeatedly across generators and renderers.

/**
 * Creates `const {name} = {initializer};`
 */
export function constDecl(name: string, initializer: ts.Expression): ts.VariableStatement {
  return factory.createVariableStatement(
    [],
    factory.createVariableDeclarationList([factory.createVariableDeclaration(name, undefined, undefined, initializer)], ts.NodeFlags.Const),
  );
}

/**
 * Creates a chained property access expression: `root.a.b.c`
 */
export function propAccess(root: string | ts.Expression, ...segments: string[]): ts.Expression {
  let expr: ts.Expression = typeof root === 'string' ? factory.createIdentifier(root) : root;
  for (const segment of segments) {
    expr = factory.createPropertyAccessExpression(expr, factory.createIdentifier(segment));
  }
  return expr;
}

/**
 * Creates `const {name} = backend.{...path};`
 */
export function constFromBackend(name: string, ...path: string[]): ts.VariableStatement {
  return constDecl(name, propAccess('backend', ...path));
}

/**
 * Creates `{target}.{property} = {value};` as an expression statement.
 */
export function assignProp(
  target: string,
  property: string,
  value: number | string | boolean | string[] | object | undefined,
): ts.ExpressionStatement {
  return factory.createExpressionStatement(
    factory.createAssignment(
      factory.createPropertyAccessExpression(factory.createIdentifier(target), factory.createIdentifier(property)),
      jsValue(value),
    ),
  );
}

/**
 * Converts a JavaScript value to a TypeScript AST expression.
 * Handles undefined, boolean, number, string, string[], and nested objects.
 */
export function jsValue(value: number | string | boolean | string[] | object | undefined): ts.Expression {
  if (value === undefined) return factory.createIdentifier('undefined');
  if (typeof value === 'boolean') return value ? factory.createTrue() : factory.createFalse();
  if (typeof value === 'number') return factory.createNumericLiteral(value);
  if (typeof value === 'string') return factory.createStringLiteral(value);
  if (Array.isArray(value)) return factory.createArrayLiteralExpression(value.map((v) => factory.createStringLiteral(v)));
  if (typeof value === 'object') {
    const props = Object.entries(value).map(([key, val]) =>
      factory.createPropertyAssignment(key, jsValue(val as number | string | boolean | string[] | object | undefined)),
    );
    return factory.createObjectLiteralExpression(props, true);
  }
  return factory.createIdentifier('undefined');
}

/**
 * Creates a `const branchName = process.env.AWS_BRANCH ?? "sandbox"` AST node.
 */
export function createBranchNameDeclaration(): ts.VariableStatement {
  return constDecl('branchName', factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'));
}

/**
 * Extracts the file path from an AWS Lambda handler string.
 * 'index.handler' → './index.js', 'src/handler.myFunction' → './src/handler.js'
 */
export function extractFilePathFromHandler(handler: string): string {
  const lastDotIndex = handler.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `./${handler}.js`;
  }
  return `./${handler.substring(0, lastDotIndex)}.js`;
}
