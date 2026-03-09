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
