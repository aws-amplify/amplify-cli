import { promises as fs } from 'fs';
import * as ts from 'typescript';

export class BackendUpdater {
  /**
   * Updates backend.ts to register custom resources
   */
  async updateBackendFile(backendFilePath: string, customResources: Map<string, string>): Promise<void> {
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
      imports.push(this.createImport(resourceName, className));
      instantiations.push(this.createInstantiation(resourceName, className));
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

  private createInstantiation(resourceName: string, className: string): ts.ExpressionStatement {
    return ts.factory.createExpressionStatement(
      ts.factory.createNewExpression(ts.factory.createIdentifier(resourceName), undefined, [
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('backend'), 'createStack'),
          undefined,
          [ts.factory.createStringLiteral(resourceName)],
        ),
        ts.factory.createStringLiteral(className),
      ]),
    );
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
