import ts from 'typescript';

const factory = ts.factory;

export const newLineIdentifier = factory.createIdentifier('\n');

/**
 * Creates a `const branchName = process.env.AWS_BRANCH ?? "sandbox"` AST node.
 */
export function createBranchNameDeclaration(): ts.VariableStatement {
  return factory.createVariableStatement(
    [],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          'branchName',
          undefined,
          undefined,
          factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
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
