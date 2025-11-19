import * as ts from 'typescript';

export class AmplifyHelperTransformer {
  static transform(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
      return (node: T) => {
        function visit(node: ts.Node): ts.Node {
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === '@aws-amplify/cli-extensibility-helper') {
              return undefined;
            }
          }

          if (ts.isCallExpression(node)) {
            const expression = node.expression;
            if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.name) && expression.name.text === 'ref') {
              const isCdkFnRef =
                ts.isPropertyAccessExpression(expression.expression) &&
                ts.isIdentifier(expression.expression.expression) &&
                expression.expression.expression.text === 'cdk' &&
                ts.isIdentifier(expression.expression.name) &&
                expression.expression.name.text === 'Fn';

              const isFnRef = ts.isIdentifier(expression.expression) && expression.expression.text === 'Fn';

              if (
                (isCdkFnRef || isFnRef) &&
                node.arguments.length === 1 &&
                ts.isStringLiteral(node.arguments[0]) &&
                node.arguments[0].text === 'env'
              ) {
                return ts.factory.createIdentifier('branchName');
              }
            }
          }

          if (ts.isPropertyAccessExpression(node)) {
            const expression = node.expression;
            if (
              ts.isCallExpression(expression) &&
              ts.isPropertyAccessExpression(expression.expression) &&
              ts.isIdentifier(expression.expression.expression) &&
              expression.expression.expression.text === 'AmplifyHelpers' &&
              expression.expression.name.text === 'getProjectInfo'
            ) {
              const propertyName = node.name.text;

              if (propertyName === 'envName') {
                return ts.factory.createIdentifier('branchName');
              }
            }
          }

          return ts.visitEachChild(node, visit, context);
        }
        return ts.visitNode(node, visit);
      };
    };

    const result = ts.transform(sourceFile, [transformer]);
    return result.transformed[0] as ts.SourceFile;
  }

  static addBranchNameVariable(sourceFile: ts.SourceFile): ts.SourceFile {
    // Check if branchName declaration already exists
    const hasBranchName = sourceFile.statements.some(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.some((decl) => ts.isIdentifier(decl.name) && decl.name.text === 'branchName'),
    );

    // Create branchName declaration: const branchName = process.env.AWS_BRANCH ?? "sandbox";
    const branchNameDeclaration = ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            'branchName',
            undefined,
            undefined,
            ts.factory.createBinaryExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('process'), 'env'),
                'AWS_BRANCH',
              ),
              ts.SyntaxKind.QuestionQuestionToken,
              ts.factory.createStringLiteral('sandbox'),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );

    const newStatements = [];
    let importsAdded = false;

    for (const stmt of sourceFile.statements) {
      if (ts.isImportDeclaration(stmt)) {
        newStatements.push(stmt);
      } else {
        if (!importsAdded) {
          if (!hasBranchName) {
            newStatements.push(branchNameDeclaration);
          }
          importsAdded = true;
        }
        newStatements.push(stmt);
      }
    }

    return ts.factory.updateSourceFile(sourceFile, newStatements);
  }
}
