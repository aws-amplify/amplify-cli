import * as ts from 'typescript';

export class AmplifyHelperTransformer {
  // Map Gen1 category names to Gen2 backend property names
  private static readonly CATEGORY_MAP: Record<string, string> = {
    function: 'functions',
    api: 'data',
    storage: 'storage',
    auth: 'auth',
  };

  // Map Gen1 output attributes to Gen2 resource property paths
  private static readonly ATTRIBUTE_MAP: Record<string, Record<string, string>> = {
    auth: {
      UserPoolId: 'userPool.userPoolId',
      UserPoolArn: 'userPool.userPoolArn',
      IdentityPoolId: 'identityPool.identityPoolId',
      AppClientID: 'userPoolClient.userPoolClientId',
      AppClientIDWeb: 'userPoolClient.userPoolClientId',
    },
    api: {
      GraphQLAPIIdOutput: 'cfnResources.cfnGraphqlApi.attrApiId',
      GraphQLAPIEndpointOutput: 'cfnResources.cfnGraphqlApi.attrGraphQlUrl',
      // Note: API key is on CfnApiKey construct, not CfnGraphQLApi
      GraphQLAPIKeyOutput: 'cfnResources.cfnApiKey.Default.attrApiKey',
    },
    storage: {
      BucketName: 'bucket.bucketName',
    },
    function: {
      Name: 'lambda.functionName',
      Arn: 'lambda.functionArn',
      LambdaExecutionRole: 'lambda.role',
    },
  };

  static transform(sourceFile: ts.SourceFile, projectName?: string): ts.SourceFile {
    // Track variable names that hold AmplifyHelpers.getProjectInfo() result
    const projectInfoVariables = new Set<string>();
    // Track parameter names with AmplifyResourceProps type
    const amplifyResourcePropsParams = new Set<string>();
    // Track dependencies from addResourceDependency calls
    const resourceDependencies = new Set<string>();

    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
      return (node: T) => {
        function visit(node: ts.Node): ts.Node {
          // Remove AmplifyHelpers import statements and AmplifyDependentResourcesAttributes import
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier)) {
              if (
                moduleSpecifier.text === '@aws-amplify/cli-extensibility-helper' ||
                moduleSpecifier.text.includes('amplify-dependent-resources-ref')
              ) {
                return undefined;
              }
            }
          }

          // Transform *.Fn.ref('env') and Fn.ref('env') calls
          if (ts.isCallExpression(node)) {
            const expression = node.expression;
            if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.name) && expression.name.text === 'ref') {
              // Check if it's *.Fn.ref or Fn.ref
              const isCdkFnRef =
                ts.isPropertyAccessExpression(expression.expression) &&
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
              // Remove this entire variable statement
              return undefined;
            }

            // Remove AmplifyHelpers.addResourceDependency variable statements
            if (declaration && declaration.initializer && ts.isCallExpression(declaration.initializer)) {
              const callExpr = declaration.initializer;
              const isAddResourceDependency =
                ts.isPropertyAccessExpression(callExpr.expression) && callExpr.expression.name.text === 'addResourceDependency';

              if (isAddResourceDependency) {
                // Extract dependencies from the call
                const args = callExpr.arguments;
                if (args.length >= 4 && ts.isArrayLiteralExpression(args[3])) {
                  args[3].elements.forEach((element) => {
                    if (ts.isObjectLiteralExpression(element)) {
                      element.properties.forEach((prop) => {
                        if (
                          ts.isPropertyAssignment(prop) &&
                          ts.isIdentifier(prop.name) &&
                          prop.name.text === 'category' &&
                          ts.isStringLiteral(prop.initializer)
                        ) {
                          resourceDependencies.add(prop.initializer.text);
                        }
                      });
                    }
                  });
                }
                // Remove this entire variable statement
                return undefined;
              }
            }
          }

          // Transform property access to AmplifyHelpers.getProjectInfo().envName or .projectName
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
            if (ts.isIdentifier(expression) && amplifyResourcePropsParams.has(expression.text)) {
              const propertyName = node.name.text;
              if (propertyName === 'resourceName') {
                return ts.factory.createIdentifier('id');
              }
              if (propertyName === 'category') {
                return ts.factory.createStringLiteral('custom');
              }
            }

            // Transform property access like amplifyResources.storage.bucket.bucketName
            // Only transform the outermost property access (when this node is not part of a larger chain)
            if (!ts.isPropertyAccessExpression(node.parent)) {
              const fullAccess = AmplifyHelperTransformer.getPropertyAccessChain(node);
              const parts = fullAccess.split('.');
              // Match pattern: amplifyResources.category.resourceName.property (4+ parts)
              if (parts.length >= 4 && parts[0].includes('amplifyResources')) {
                const gen1Category = parts[1];
                const gen2Category = AmplifyHelperTransformer.CATEGORY_MAP[gen1Category] || gen1Category;
                const resourceName = parts[2];
                const gen1Attribute = parts[3];
                const mappedAttribute = AmplifyHelperTransformer.ATTRIBUTE_MAP[gen1Category]?.[gen1Attribute];
                const gen2Property = mappedAttribute || parts.slice(3).join('.');

                // Functions need resource name preserved: functions.myFunc.resources.lambda.functionArn
                if (gen1Category === 'function') {
                  return AmplifyHelperTransformer.createPropertyAccessFromString(
                    `${gen2Category}.${resourceName}.resources.${gen2Property}`,
                  );
                }

                // Other categories: auth.resources.userPool.userPoolId
                return AmplifyHelperTransformer.createPropertyAccessFromString(`${gen2Category}.resources.${gen2Property}`);
              }
            }
          }

          // Track constructor parameters with AmplifyResourceProps type
          if (ts.isConstructorDeclaration(node)) {
            node.parameters.forEach((param) => {
              if (param.type && ts.isTypeReferenceNode(param.type) && ts.isIdentifier(param.name)) {
                const typeText = param.type.getText();
                if (typeText.includes('AmplifyResourceProps')) {
                  amplifyResourcePropsParams.add(param.name.text);
                }
              }
            });
          }

          // Visit children first
          const visitedNode = ts.visitEachChild(node, visit, context);

          // Transform class declarations: change Stack/NestedStack extends to Construct
          if (ts.isClassDeclaration(visitedNode) && visitedNode.heritageClauses) {
            const newHeritageClauses = visitedNode.heritageClauses.map((clause) => {
              const newTypes = clause.types.map((type) => {
                const typeText = type.expression.getText();
                if (typeText.endsWith('.Stack') || typeText.endsWith('.NestedStack')) {
                  return ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier('Construct'), type.typeArguments);
                }
                return type;
              });
              return ts.factory.updateHeritageClause(clause, newTypes);
            });
            return ts.factory.updateClassDeclaration(
              visitedNode,
              visitedNode.modifiers,
              visitedNode.name,
              visitedNode.typeParameters,
              newHeritageClauses,
              visitedNode.members,
            );
          }

          // Transform constructor: add resource dependencies as parameters
          if (ts.isConstructorDeclaration(visitedNode)) {
            const baseParams = visitedNode.parameters.slice(0, 2); // scope, id

            // Add resource dependency parameters with Gen2 naming
            const resourceParams = Array.from(resourceDependencies).map((gen1Category) => {
              const gen2Category = AmplifyHelperTransformer.CATEGORY_MAP[gen1Category] || gen1Category;
              return ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                gen2Category,
                undefined,
                ts.factory.createTypeReferenceNode('any'),
                undefined,
              );
            });

            const newParams = [...baseParams, ...resourceParams];
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

    const newStatements = [];

    // Add imports
    newStatements.push(...sourceFile.statements.filter((stmt) => ts.isImportDeclaration(stmt)));

    // Add branchName declaration if needed
    if (!hasBranchName) {
      newStatements.push(branchNameDeclaration);
    }

    // Add projectName declaration if needed
    if (!hasProjectName && projectNameDeclaration) {
      newStatements.push(projectNameDeclaration);
    }

    // Add remaining statements (classes, etc.)
    newStatements.push(...sourceFile.statements.filter((stmt) => !ts.isImportDeclaration(stmt)));

    return ts.factory.updateSourceFile(sourceFile, newStatements);
  }

  private static getPropertyAccessChain(node: ts.PropertyAccessExpression): string {
    const parts: string[] = [];
    let current: ts.Node = node;

    while (ts.isPropertyAccessExpression(current)) {
      parts.unshift(current.name.text);
      current = current.expression;
    }

    if (ts.isIdentifier(current)) {
      parts.unshift(current.text);
    }

    return parts.join('.');
  }

  private static createPropertyAccessFromString(accessPath: string): ts.Expression {
    const parts = accessPath.split('.');
    let expression: ts.Expression = ts.factory.createIdentifier(parts[0]);

    for (let i = 1; i < parts.length; i++) {
      expression = ts.factory.createPropertyAccessExpression(expression, parts[i]);
    }

    return expression;
  }
}
