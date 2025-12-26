import { promises as fs } from 'fs';
import * as ts from 'typescript';

export class BackendUpdater {
  /**
   * Updates backend.ts to register custom resources
   */
  async updateBackendFile(
    backendFilePath: string,
    customResources: Map<string, string>,
    resourceDependencies?: Map<string, string[]>,
    functionNames?: string[],
  ): Promise<void> {
    if (customResources.size === 0) {
      return;
    }
    const content = await fs.readFile(backendFilePath, 'utf-8');
    const sourceFile = ts.createSourceFile(backendFilePath, content, ts.ScriptTarget.Latest, true);

    const imports: ts.ImportDeclaration[] = [];
    const instantiations: ts.ExpressionStatement[] = [];

    const entries = Array.from(customResources.entries());
    for (let i = 0; i < entries.length; i++) {
      const [resourceName, className] = entries[i];
      const deps = resourceDependencies?.get(resourceName) || [];
      imports.push(this.createImport(resourceName, className));
      instantiations.push(this.createInstantiation(resourceName, className, deps, functionNames));
    }

    const updatedFile = this.injectIntoBackend(sourceFile, imports, instantiations);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const updatedContent = printer.printFile(updatedFile);

    await fs.writeFile(backendFilePath, updatedContent, 'utf-8');
  }

  private createImport(resourceName: string, className: string): ts.ImportDeclaration {
    return ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(
        false,
        undefined,
        ts.factory.createNamedImports([
          ts.factory.createImportSpecifier(false, ts.factory.createIdentifier(className), ts.factory.createIdentifier(resourceName)),
        ]),
      ),
      ts.factory.createStringLiteral(`./custom/${resourceName}/resource`),
    );
  }

  // Map Gen1 category names to Gen2 backend property names
  private static readonly CATEGORY_MAP: Record<string, string> = {
    function: 'functions',
    api: 'data',
    storage: 'storage',
    auth: 'auth',
  };

  private createInstantiation(resourceName: string, className: string, dependencies?: string[], functionNames?: string[]): ts.ExpressionStatement {
    const args: ts.Expression[] = [
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('backend'), 'createStack'),
        undefined,
        [ts.factory.createStringLiteral(resourceName)],
      ),
      ts.factory.createStringLiteral(resourceName),
    ];

    // Add dependencies as positional arguments
    if (dependencies && dependencies.length > 0) {
      const functionDeps: string[] = [];
      const otherDeps: string[] = [];
      
      // Separate function dependencies from other categories
      dependencies.forEach((dep) => {
        if (dep === 'function') {
          functionDeps.push(dep);
        } else {
          otherDeps.push(dep);
        }
      });
      
      // Add non-function dependencies as direct backend properties
      otherDeps.forEach((dep) => {
        const gen2Name = BackendUpdater.CATEGORY_MAP[dep] || dep;
        args.push(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('backend'), gen2Name));
      });
      
      // Add function dependencies as object literal
      if (functionDeps.length > 0 && functionNames && functionNames.length > 0) {
        const functionProperties: ts.PropertyAssignment[] = functionNames.map(funcName => 
          ts.factory.createPropertyAssignment(
            funcName,
            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('backend'), funcName)
          )
        );
        
        const functionObject = ts.factory.createObjectLiteralExpression(functionProperties);
        args.push(functionObject);
      }
    }

    return ts.factory.createExpressionStatement(ts.factory.createNewExpression(ts.factory.createIdentifier(resourceName), undefined, args));
  }

  private injectIntoBackend(
    sourceFile: ts.SourceFile,
    imports: ts.ImportDeclaration[],
    instantiations: ts.ExpressionStatement[],
  ): ts.SourceFile {
    const statements = [...sourceFile.statements];

    // Find last import index
    let lastImportIndex = -1;
    for (let i = 0; i < statements.length; i++) {
      if (ts.isImportDeclaration(statements[i])) {
        lastImportIndex = i;
      }
    }

    // Insert imports after last import
    statements.splice(lastImportIndex + 1, 0, ...imports);

    // Append instantiations at the end
    statements.push(...instantiations);

    return ts.factory.updateSourceFile(sourceFile, statements);
  }
}
