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

  /**
   * Transforms Gen1 AmplifyHelpers patterns to Gen2 equivalents via AST rewriting.
   */
  public static transform(sourceFile: ts.SourceFile, projectName?: string): ts.SourceFile {
    // Track variable names that hold AmplifyHelpers.getProjectInfo() result
    const projectInfoVariables = new Set<string>();
    // Track parameter names with AmplifyResourceProps type
    const amplifyResourcePropsParams = new Set<string>();
    // Track whether the resource has any dependencies from addResourceDependency calls
    let hasDependencies = false;
    // Track variable names assigned from addResourceDependency (e.g., `dependencies`, `deps`)
    const dependencyVariables = new Set<string>();
    // Track identifiers imported from `amplify-dependent-resources-ref` so we can remove calls to them
    const removedModuleIdentifiers = new Set<string>();

    const transformer = <T extends ts.Node>(context: ts.TransformationContext) => {
      return (node: T) => {
        function visit(node: ts.Node): ts.Node {
          // Remove import statements for amplify-dependent-resources-ref and cli-extensibility-helper
          if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier)) {
              if (moduleSpecifier.text.includes('amplify-dependent-resources-ref')) {
                // Track imported identifiers so we can remove variable declarations that call them
                if (node.importClause) {
                  if (node.importClause.name && ts.isIdentifier(node.importClause.name)) {
                    removedModuleIdentifiers.add(node.importClause.name.text);
                  }
                  if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
                    for (const specifier of node.importClause.namedBindings.elements) {
                      removedModuleIdentifiers.add(specifier.name.text);
                    }
                  }
                }
                return undefined;
              }
              if (moduleSpecifier.text === '@aws-amplify/cli-extensibility-helper') {
                return undefined;
              }
            }
          }

          // Transform *.Fn.ref('env') and Fn.ref('env') calls, and dependency property access refs
          if (ts.isCallExpression(node)) {
            const expression = node.expression;
            if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.name) && expression.name.text === 'ref') {
              const isCdkFnRef =
                ts.isPropertyAccessExpression(expression.expression) &&
                ts.isIdentifier(expression.expression.name) &&
                expression.expression.name.text === 'Fn';

              const isFnRef = ts.isIdentifier(expression.expression) && expression.expression.text === 'Fn';

              if ((isCdkFnRef || isFnRef) && node.arguments.length === 1) {
                const arg = node.arguments[0];

                // Handle cdk.Fn.ref('env') → branchName
                if (ts.isStringLiteral(arg) && arg.text === 'env') {
                  return ts.factory.createIdentifier('branchName');
                }

                // Handle cdk.Fn.ref(dependencies.category.resource.attribute) → backend.gen2Category.resources.gen2Path
                if (ts.isPropertyAccessExpression(arg)) {
                  const chain = AmplifyHelperTransformer.getPropertyAccessChain(arg);
                  const parts = chain.split('.');
                  if (parts.length >= 4 && dependencyVariables.has(parts[0])) {
                    const gen1Category = parts[1];
                    const gen2Category = AmplifyHelperTransformer.CATEGORY_MAP[gen1Category] || gen1Category;
                    const attribute = parts[3];
                    const mappedAttr = AmplifyHelperTransformer.ATTRIBUTE_MAP[gen1Category]?.[attribute];
                    const gen2Path = mappedAttr || attribute;

                    if (gen1Category === 'function') {
                      return AmplifyHelperTransformer.createPropertyAccessFromString(
                        `backend.${gen2Category}.${parts[2]}.resources.${gen2Path}`,
                      );
                    }
                    return AmplifyHelperTransformer.createPropertyAccessFromString(`backend.${gen2Category}.resources.${gen2Path}`);
                  }
                }
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

            // Remove AmplifyHelpers.addResourceDependency variable statements
            if (declaration && declaration.initializer && ts.isCallExpression(declaration.initializer)) {
              const callExpr = declaration.initializer;
              const isAddResourceDependency =
                ts.isPropertyAccessExpression(callExpr.expression) && callExpr.expression.name.text === 'addResourceDependency';

              if (isAddResourceDependency) {
                if (ts.isIdentifier(declaration.name)) {
                  dependencyVariables.add(declaration.name.text);
                }
                hasDependencies = true;
                return undefined;
              }
            }

            // Remove `const envParam = new cdk.CfnParameter(this, 'env', ...)` variable statements
            if (declaration && declaration.initializer && ts.isNewExpression(declaration.initializer)) {
              const newExpr = declaration.initializer;
              const exprText = newExpr.expression;
              const isCfnParameter =
                (ts.isPropertyAccessExpression(exprText) && exprText.name.text === 'CfnParameter') ||
                (ts.isIdentifier(exprText) && exprText.text === 'CfnParameter');

              if (isCfnParameter && newExpr.arguments && newExpr.arguments.length >= 2) {
                const secondArg = newExpr.arguments[1];
                if (ts.isStringLiteral(secondArg) && secondArg.text === 'env') {
                  return undefined;
                }
              }
            }

            // Remove variable declarations with AmplifyDependentResourcesAttributes type annotation
            if (declaration && declaration.type && ts.isTypeReferenceNode(declaration.type)) {
              const typeName = declaration.type.typeName;
              if (ts.isIdentifier(typeName) && typeName.text === 'AmplifyDependentResourcesAttributes') {
                return undefined;
              }
            }

            // Remove variable declarations whose initializer calls a function imported from amplify-dependent-resources-ref
            if (
              declaration &&
              declaration.initializer &&
              ts.isCallExpression(declaration.initializer) &&
              ts.isIdentifier(declaration.initializer.expression) &&
              removedModuleIdentifiers.has(declaration.initializer.expression.text)
            ) {
              return undefined;
            }

            // Strip `as AmplifyDependentResourcesAttributes` type assertions while preserving the variable
            if (declaration && declaration.initializer && ts.isAsExpression(declaration.initializer)) {
              const asExpr = declaration.initializer;
              if (ts.isTypeReferenceNode(asExpr.type)) {
                const typeName = asExpr.type.typeName;
                if (ts.isIdentifier(typeName) && typeName.text === 'AmplifyDependentResourcesAttributes') {
                  const updatedDeclaration = ts.factory.updateVariableDeclaration(
                    declaration,
                    declaration.name,
                    declaration.exclamationToken,
                    declaration.type,
                    asExpr.expression,
                  );
                  const updatedDeclarationList = ts.factory.updateVariableDeclarationList(node.declarationList, [updatedDeclaration]);
                  return ts.factory.updateVariableStatement(node, node.modifiers, updatedDeclarationList);
                }
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
              if (propertyName === 'envName') return ts.factory.createIdentifier('branchName');
              if (propertyName === 'projectName') return ts.factory.createIdentifier('projectName');
            }

            // Handle variable access: amplifyProjectInfo.propertyName
            if (ts.isIdentifier(expression) && projectInfoVariables.has(expression.text)) {
              const propertyName = node.name.text;
              if (propertyName === 'envName') return ts.factory.createIdentifier('branchName');
              if (propertyName === 'projectName') return ts.factory.createIdentifier('projectName');
            }

            // Handle amplifyResourceProps transformations
            if (ts.isIdentifier(expression) && amplifyResourcePropsParams.has(expression.text)) {
              const propertyName = node.name.text;
              if (propertyName === 'resourceName') return ts.factory.createIdentifier('id');
              if (propertyName === 'category') return ts.factory.createStringLiteral('custom');
            }

            // Transform property access like amplifyResources.storage.bucket.bucketName or dependency variable access
            if (!ts.isPropertyAccessExpression(node.parent)) {
              const fullAccess = AmplifyHelperTransformer.getPropertyAccessChain(node);
              const parts = fullAccess.split('.');
              if (parts.length >= 4 && (parts[0].includes('amplifyResources') || dependencyVariables.has(parts[0]))) {
                const gen1Category = parts[1];
                const gen2Category = AmplifyHelperTransformer.CATEGORY_MAP[gen1Category] || gen1Category;
                const resourceName = parts[2];
                const gen1Attribute = parts[3];
                const mappedAttribute = AmplifyHelperTransformer.ATTRIBUTE_MAP[gen1Category]?.[gen1Attribute];
                const gen2Property = mappedAttribute || parts.slice(3).join('.');

                if (gen1Category === 'function') {
                  return AmplifyHelperTransformer.createPropertyAccessFromString(
                    `backend.${gen2Category}.${resourceName}.resources.${gen2Property}`,
                  );
                }
                return AmplifyHelperTransformer.createPropertyAccessFromString(`backend.${gen2Category}.resources.${gen2Property}`);
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

          // Remove `new cdk.CfnParameter(this, 'env', ...)` expression statements
          if (ts.isExpressionStatement(node)) {
            const expr = node.expression;
            if (ts.isNewExpression(expr)) {
              const exprText = expr.expression;
              const isCfnParameter =
                (ts.isPropertyAccessExpression(exprText) && exprText.name.text === 'CfnParameter') ||
                (ts.isIdentifier(exprText) && exprText.text === 'CfnParameter');

              if (isCfnParameter && expr.arguments && expr.arguments.length >= 2) {
                const secondArg = expr.arguments[1];
                if (ts.isStringLiteral(secondArg) && secondArg.text === 'env') {
                  return undefined;
                }
              }
            }
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

          // Transform constructor: add backend parameter if resource has dependencies
          if (ts.isConstructorDeclaration(visitedNode)) {
            const baseParams = visitedNode.parameters.slice(0, 2); // scope, id

            if (hasDependencies) {
              const backendParam = ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                'backend',
                undefined,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                undefined,
              );
              baseParams.push(backendParam);
            }

            return ts.factory.updateConstructorDeclaration(visitedNode, visitedNode.modifiers, baseParams, visitedNode.body);
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

  /**
   * Inserts branchName and projectName variable declarations after imports.
   */
  public static addBranchNameVariable(sourceFile: ts.SourceFile, projectName?: string): ts.SourceFile {
    const hasBranchName = sourceFile.statements.some(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.some((decl) => ts.isIdentifier(decl.name) && decl.name.text === 'branchName'),
    );

    const hasProjectName = sourceFile.statements.some(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.some((decl) => ts.isIdentifier(decl.name) && decl.name.text === 'projectName'),
    );

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
    newStatements.push(...sourceFile.statements.filter((stmt) => ts.isImportDeclaration(stmt)));
    if (!hasBranchName) newStatements.push(branchNameDeclaration);
    if (!hasProjectName && projectNameDeclaration) newStatements.push(projectNameDeclaration);
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
