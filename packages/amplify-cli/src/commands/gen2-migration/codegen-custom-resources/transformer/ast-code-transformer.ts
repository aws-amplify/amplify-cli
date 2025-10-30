import * as ts from 'typescript';
import { ParsedStack } from '../types';

export interface TransformationResult {
  transformedCode: string;
  imports: string[];
  className: string;
  constructorBody: string;
}

export class ASTCodeTransformer {
  transform(parsed: ParsedStack, resourceName: string): TransformationResult {
    const transformedConstructorBody = this.transformCode(parsed.constructorBody);

    return {
      transformedCode: transformedConstructorBody,
      imports: this.transformImports(parsed.imports),
      className: this.generateClassName(resourceName),
      constructorBody: transformedConstructorBody,
    };
  }

  private transformCode(code: string): string {
    // Simple string replacement for resource dependency calls as fallback
    if (code.includes('AmplifyHelpers.addResourceDependency')) {
      code = code.replace(/AmplifyHelpers\.addResourceDependency\([^)]*\)/g, 'console.log("TODO: Manual migration required")');
    }

    try {
      const sourceFile = ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest, true);

      const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        return (sourceFile) => {
          const visitor = (node: ts.Node): ts.Node => {
            try {
              // Check current node first
              if (this.isCdkFnRefCall(node)) {
                return this.createProcessEnvAccess();
              }
              if (this.isFnRefCall(node)) {
                return this.createProcessEnvAccess();
              }
              if (this.isAmplifyHelpersCall(node)) {
                return this.transformAmplifyHelperCall(node as ts.CallExpression);
              }
              if (this.isResourceDependencyCall(node)) {
                return this.createTodoComment('Manual migration required');
              }
              if (this.isCfnParameterNewExpression(node)) {
                return this.createTodoComment('Parameter transformation needed');
              }
              if (ts.isExpressionStatement(node) && this.isCfnParameterNewExpression(node.expression)) {
                return this.createTodoComment('Parameter transformation needed');
              }

              // Always visit children to catch nested patterns
              return ts.visitEachChild(node, visitor, context);
            } catch (error) {
              // If transformation fails, return original node
              return node;
            }
          };
          return ts.visitNode(sourceFile, visitor);
        };
      };

      const result = ts.transform(sourceFile, [transformer]);
      const printer = ts.createPrinter();
      return printer.printFile(result.transformed[0]);
    } catch (error) {
      // If AST transformation fails completely, return the string-replaced code
      return code;
    }
  }

  private isCdkFnRefCall(node: ts.Node): boolean {
    if (!ts.isCallExpression(node)) return false;
    if (!ts.isPropertyAccessExpression(node.expression)) return false;

    const expression = node.expression;
    if (!ts.isPropertyAccessExpression(expression.expression)) return false;

    const outerExpression = expression.expression;
    return (
      ts.isIdentifier(outerExpression.expression) &&
      outerExpression.expression.text === 'cdk' &&
      ts.isIdentifier(outerExpression.name) &&
      outerExpression.name.text === 'Fn' &&
      ts.isIdentifier(expression.name) &&
      expression.name.text === 'ref'
    );
  }

  private isFnRefCall(node: ts.Node): boolean {
    if (!ts.isCallExpression(node)) return false;
    if (!ts.isPropertyAccessExpression(node.expression)) return false;

    const expression = node.expression;
    return (
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'Fn' &&
      ts.isIdentifier(expression.name) &&
      expression.name.text === 'ref'
    );
  }

  private isResourceDependencyCall(node: ts.Node): boolean {
    if (!ts.isCallExpression(node)) return false;
    if (!ts.isPropertyAccessExpression(node.expression)) return false;

    const expression = node.expression;
    return (
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'AmplifyHelpers' &&
      ts.isIdentifier(expression.name) &&
      expression.name.text === 'addResourceDependency'
    );
  }

  private isAmplifyHelpersCall(node: ts.Node): boolean {
    if (!ts.isCallExpression(node)) return false;

    const expression = node.expression;
    if (!ts.isPropertyAccessExpression(expression)) return false;

    return (
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'AmplifyHelpers' &&
      ts.isIdentifier(expression.name) &&
      expression.name.text === 'getProjectInfo'
    );
  }

  private isCfnParameterNewExpression(node: ts.Node): boolean {
    if (!ts.isNewExpression(node)) return false;

    if (ts.isIdentifier(node.expression) && node.expression.text === 'CfnParameter') {
      return true;
    }

    if (ts.isPropertyAccessExpression(node.expression)) {
      const expr = node.expression;
      return (
        ts.isIdentifier(expr.expression) &&
        expr.expression.text === 'cdk' &&
        ts.isIdentifier(expr.name) &&
        expr.name.text === 'CfnParameter'
      );
    }

    return false;
  }

  private createTodoComment(message: string): ts.ExpressionStatement {
    return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('console'), 'log'), undefined, [
        ts.factory.createStringLiteral(`TODO: ${message}`),
      ]),
    );
  }

  private createProcessEnvAccess(): ts.PropertyAccessExpression {
    return ts.factory.createPropertyAccessExpression(
      ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('process'), 'env'),
      'AMPLIFY_ENV',
    );
  }

  private transformAmplifyHelperCall(node: ts.CallExpression): ts.Node {
    const expression = node.expression as ts.PropertyAccessExpression;

    if (expression.name.text === 'getProjectInfo') {
      return ts.factory.createBinaryExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('process'), 'env'),
          'AMPLIFY_PROJECT_NAME',
        ),
        ts.SyntaxKind.BarBarToken,
        ts.factory.createStringLiteral('myproject'),
      );
    }

    return node;
  }

  private createProjectInfoReplacement(node: ts.CallExpression): ts.Node {
    // Check if this is inside a variable declaration
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent)) {
      return ts.factory.createVariableDeclaration(
        parent.name,
        parent.exclamationToken,
        parent.type,
        ts.factory.createBinaryExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('process'), 'env'),
            'AMPLIFY_PROJECT_NAME',
          ),
          ts.SyntaxKind.BarBarToken,
          ts.factory.createStringLiteral('myproject'),
        ),
      );
    }

    return node;
  }

  private createResourceDependencyTodo(node: ts.CallExpression): ts.Node {
    // Create a TODO comment for resource dependencies
    const originalCall = node.getText();

    return ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('console'), 'log'), undefined, [
        ts.factory.createStringLiteral(`TODO: Handle resource dependency - ${originalCall}`),
      ]),
    );
  }

  private generateClassName(resourceName: string): string {
    // Check if resourceName already ends with 'Stack'
    if (resourceName.toLowerCase().endsWith('stack')) {
      return resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
    }

    return (
      resourceName
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') + 'Stack'
    );
  }

  private transformImports(imports: string[]): string[] {
    return imports.filter((imp) => !imp.includes('@aws-amplify/cli-extensibility-helper'));
  }
}
