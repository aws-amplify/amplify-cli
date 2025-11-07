import * as ts from 'typescript';

export class AmplifyHelperTransformer {
  static transform(sourceFile: ts.SourceFile): ts.SourceFile {
    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
      return (node: T) => {
        function visit(node: ts.Node): ts.Node {
          // Remove AmplifyHelpers import statements
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === '@aws-amplify/cli-extensibility-helper') {
              // Return undefined to remove this import
              return undefined;
            }
          }

          // Transform standalone cdk.Fn.ref('env') calls
          if (ts.isCallExpression(node)) {
            const expression = node.expression;
            if (
              ts.isPropertyAccessExpression(expression) &&
              ts.isPropertyAccessExpression(expression.expression) &&
              ts.isIdentifier(expression.expression.expression) &&
              expression.expression.expression.text === 'cdk' &&
              ts.isIdentifier(expression.expression.name) &&
              expression.expression.name.text === 'Fn' &&
              ts.isIdentifier(expression.name) &&
              expression.name.text === 'ref' &&
              node.arguments.length === 1 &&
              ts.isStringLiteral(node.arguments[0]) &&
              node.arguments[0].text === 'env'
            ) {
              return ts.factory.createIdentifier('branchName');
            }
          }

          // Transform AmplifyHelpers calls
          if (ts.isCallExpression(node)) {
            const expression = node.expression;
            if (
              ts.isPropertyAccessExpression(expression) &&
              ts.isIdentifier(expression.expression) &&
              expression.expression.text === 'AmplifyHelpers'
            ) {
              const methodName = expression.name.text;

              // Transform getProjectInfo() calls
              if (methodName === 'getProjectInfo') {
                return ts.factory.createObjectLiteralExpression([
                  ts.factory.createPropertyAssignment(
                    'projectName',
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createCallExpression(
                        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('Stack'), ts.factory.createIdentifier('of')),
                        undefined,
                        [ts.factory.createThis()],
                      ),
                      ts.factory.createIdentifier('stackName'),
                    ),
                  ),
                  ts.factory.createPropertyAssignment('envName', ts.factory.createIdentifier('branchName')),
                ]);
              }

              // Transform addResourceDependency calls - return undefined to remove them
              if (methodName === 'addResourceDependency') {
                // We'll handle this in post-processing by adding comments
                return undefined;
              }
            }
          }

          // Transform property access to AmplifyHelpers.getProjectInfo().projectName
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

              if (propertyName === 'projectName') {
                return ts.factory.createPropertyAccessExpression(
                  ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('Stack'), ts.factory.createIdentifier('of')),
                    undefined,
                    [ts.factory.createThis()],
                  ),
                  ts.factory.createIdentifier('stackName'),
                );
              }

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

  static addRequiredImports(sourceFile: ts.SourceFile): ts.SourceFile {
    // Check if Stack import already exists
    const hasStackImport = sourceFile.statements.some(
      (stmt) =>
        ts.isImportDeclaration(stmt) &&
        ts.isStringLiteral(stmt.moduleSpecifier) &&
        stmt.moduleSpecifier.text === 'aws-cdk-lib' &&
        stmt.importClause?.namedBindings &&
        ts.isNamedImports(stmt.importClause.namedBindings) &&
        stmt.importClause.namedBindings.elements.some((element) => element.name.text === 'Stack'),
    );

    if (!hasStackImport) {
      // Add Stack import from aws-cdk-lib
      const stackImport = ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          false,
          undefined,
          ts.factory.createNamedImports([ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('Stack'))]),
        ),
        ts.factory.createStringLiteral('aws-cdk-lib'),
      );

      return ts.factory.updateSourceFile(sourceFile, [
        stackImport,
        ...sourceFile.statements.filter(
          (stmt) =>
            !(
              ts.isImportDeclaration(stmt) &&
              ts.isStringLiteral(stmt.moduleSpecifier) &&
              stmt.moduleSpecifier.text === '@aws-amplify/cli-extensibility-helper'
            ),
        ),
      ]);
    }

    // Just remove AmplifyHelpers import if Stack import exists
    return ts.factory.updateSourceFile(
      sourceFile,
      sourceFile.statements.filter(
        (stmt) =>
          !(
            ts.isImportDeclaration(stmt) &&
            ts.isStringLiteral(stmt.moduleSpecifier) &&
            stmt.moduleSpecifier.text === '@aws-amplify/cli-extensibility-helper'
          ),
      ),
    );
  }
}
