import * as ts from 'typescript';

export class AmplifyHelperTransformer {
  static transform(sourceFile: ts.SourceFile, projectName?: string): ts.SourceFile {
    // Track variable names that hold AmplifyHelpers.getProjectInfo() result
    const projectInfoVariables = new Set<string>();

    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
      return (node: T) => {
        function visit(node: ts.Node): ts.Node {
          // Remove AmplifyHelpers import statements
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === '@aws-amplify/cli-extensibility-helper') {
              return undefined;
            }
          }

          // Transform cdk.Fn.ref('env') and Fn.ref('env') calls
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

          // Track and remove variable statements assigned from AmplifyHelpers.getProjectInfo()
          if (ts.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (
              declaration &&
              declaration.initializer &&
              ts.isCallExpression(declaration.initializer) &&
              ts.isPropertyAccessExpression(declaration.initializer.expression) &&
              ts.isIdentifier(declaration.initializer.expression.expression) &&
              declaration.initializer.expression.expression.text === 'AmplifyHelpers' &&
              declaration.initializer.expression.name.text === 'getProjectInfo' &&
              ts.isIdentifier(declaration.name)
            ) {
              projectInfoVariables.add(declaration.name.text);
              return undefined;
            }
          }

          // Transform property access
          if (ts.isPropertyAccessExpression(node)) {
            const expression = node.expression;

            // Handle direct call: AmplifyHelpers.getProjectInfo().propertyName
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
              if (propertyName === 'projectName') {
                return ts.factory.createIdentifier('projectName');
              }
            }

            // Handle variable access: amplifyProjectInfo.propertyName
            if (ts.isIdentifier(expression) && projectInfoVariables.has(expression.text)) {
              const propertyName = node.name.text;
              if (propertyName === 'envName') {
                return ts.factory.createIdentifier('branchName');
              }
              if (propertyName === 'projectName') {
                return ts.factory.createIdentifier('projectName');
              }
            }

            // Handle amplifyResourceProps transformations
            if (ts.isIdentifier(expression) && expression.text === 'amplifyResourceProps') {
              const propertyName = node.name.text;
              if (propertyName === 'resourceName') {
                return ts.factory.createIdentifier('id');
              }
              if (propertyName === 'category') {
                return ts.factory.createStringLiteral('custom');
              }
            }
          }

          // Visit children first
          const visitedNode = ts.visitEachChild(node, visit, context);

          // Transform constructor: remove props and amplifyResourceProps parameters
          if (ts.isConstructorDeclaration(visitedNode)) {
            const newParams = visitedNode.parameters.slice(0, 2);
            return ts.factory.updateConstructorDeclaration(visitedNode, visitedNode.modifiers, newParams, visitedNode.body);
          }

          // Transform super() call: remove props argument
          if (ts.isCallExpression(visitedNode) && visitedNode.expression.kind === ts.SyntaxKind.SuperKeyword) {
            const newArgs = visitedNode.arguments.slice(0, 2);
            return ts.factory.updateCallExpression(visitedNode, visitedNode.expression, visitedNode.typeArguments, newArgs);
          }

          return visitedNode;
        }
        return ts.visitNode(node, visit);
      };
    };

    const result = ts.transform(sourceFile, [transformer]);
    return result.transformed[0] as ts.SourceFile;
  }

  static addBranchNameVariable(sourceFile: ts.SourceFile, projectName?: string): ts.SourceFile {
    // Check if branchName declaration already exists
    const hasBranchName = sourceFile.statements.some(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.some((decl) => ts.isIdentifier(decl.name) && decl.name.text === 'branchName'),
    );

    // Check if projectName declaration already exists
    const hasProjectName = sourceFile.statements.some(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.some((decl) => ts.isIdentifier(decl.name) && decl.name.text === 'projectName'),
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

    // Create projectName declaration: const projectName = "project-name";
    const projectNameDeclaration = projectName
      ? ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [ts.factory.createVariableDeclaration('projectName', undefined, undefined, ts.factory.createStringLiteral(projectName))],
            ts.NodeFlags.Const,
          ),
        )
      : undefined;

    const filteredStatements = sourceFile.statements.filter(
      (stmt) =>
        !(
          ts.isImportDeclaration(stmt) &&
          ts.isStringLiteral(stmt.moduleSpecifier) &&
          stmt.moduleSpecifier.text === '@aws-amplify/cli-extensibility-helper'
        ),
    );

    const newStatements = [];

    // Add imports
    newStatements.push(...filteredStatements.filter((stmt) => ts.isImportDeclaration(stmt)));

    // Add branchName declaration if needed
    if (!hasBranchName) {
      newStatements.push(branchNameDeclaration);
    }

    // Add projectName declaration if needed
    if (!hasProjectName && projectNameDeclaration) {
      newStatements.push(projectNameDeclaration);
    }

    // Add remaining statements (classes, etc.)
    newStatements.push(...filteredStatements.filter((stmt) => !ts.isImportDeclaration(stmt)));

    return ts.factory.updateSourceFile(sourceFile, newStatements);
  }
}
