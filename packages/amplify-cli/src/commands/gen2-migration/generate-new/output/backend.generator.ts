import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { printNodes } from '../ts-writer';

const factory = ts.factory;

/**
 * Accumulates imports, statements, and defineBackend properties from
 * category generators, then writes the final `backend.ts` file.
 *
 * Category generators call `addImport()`, `addStatement()`, and
 * `addDefineBackendProperty()` during their `plan()` phase. When
 * `BackendGenerator.plan()` runs last, it assembles everything into
 * a single `backend.ts` file.
 */
export class BackendGenerator implements Generator {
  private readonly imports: Array<{ readonly source: string; identifiers: string[] }> = [];
  private readonly defineBackendProperties: ts.ObjectLiteralElementLike[] = [];
  private readonly postDefineStatements: ts.Statement[] = [];
  private readonly outputDir: string;

  public constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Adds an import to backend.ts. Merges identifiers for the same source.
   */
  public addImport(source: string, identifiers: string[]): void {
    const existing = this.imports.find((i) => i.source === source);
    if (existing) {
      for (const id of identifiers) {
        if (!existing.identifiers.includes(id)) {
          existing.identifiers.push(id);
        }
      }
    } else {
      this.imports.push({ source, identifiers: [...identifiers] });
    }
  }

  /**
   * Adds a property to the `defineBackend({ ... })` call.
   */
  public addDefineBackendProperty(property: ts.ObjectLiteralElementLike): void {
    this.defineBackendProperties.push(property);
  }

  /**
   * Adds a statement after the `defineBackend()` call (overrides, escape hatches).
   */
  public addStatement(statement: ts.Statement): void {
    this.postDefineStatements.push(statement);
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const backendTsPath = path.join(this.outputDir, 'amplify', 'backend.ts');

    return [
      {
        describe: async () => [`Generate ${backendTsPath}`],
        execute: async () => {
          const nodes: ts.Node[] = [];

          for (const imp of this.imports) {
            nodes.push(createImportDeclaration(imp.source, imp.identifiers));
          }

          // Always import defineBackend
          nodes.push(createImportDeclaration('@aws-amplify/backend', ['defineBackend']));

          // const backend = defineBackend({ auth, data, storage, ... })
          const callExpr = factory.createCallExpression(factory.createIdentifier('defineBackend'), undefined, [
            factory.createObjectLiteralExpression(this.defineBackendProperties, true),
          ]);
          const backendDecl = factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [factory.createVariableDeclaration('backend', undefined, undefined, callExpr)],
              ts.NodeFlags.Const,
            ),
          );
          nodes.push(backendDecl);

          nodes.push(...this.postDefineStatements);

          const nodeArray = factory.createNodeArray(nodes as ts.Statement[]);
          const content = printNodes(nodeArray);

          await fs.mkdir(path.dirname(backendTsPath), { recursive: true });
          await fs.writeFile(backendTsPath, content, 'utf-8');
        },
      },
    ];
  }
}

function createImportDeclaration(source: string, identifiers: string[]): ts.ImportDeclaration {
  const importSpecifiers = identifiers.map((id) => factory.createImportSpecifier(false, undefined, factory.createIdentifier(id)));
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(false, undefined, factory.createNamedImports(importSpecifiers)),
    factory.createStringLiteral(source),
  );
}
