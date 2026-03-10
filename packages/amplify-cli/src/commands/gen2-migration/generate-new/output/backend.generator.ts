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
  private readonly earlyStatements: ts.Statement[] = [];
  private readonly outputDir: string;
  private hasBranchName = false;

  public constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Adds an import to backend.ts. Does not merge — each call adds a separate import declaration.
   * Duplicate source+identifier combinations are silently ignored.
   */
  public addImport(source: string, identifiers: string[]): void {
    const existing = this.imports.find((i) => i.source === source);
    if (existing) {
      const newIds = identifiers.filter((id) => !existing.identifiers.includes(id));
      if (newIds.length > 0) {
        this.imports.push({ source, identifiers: [...newIds] });
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

  /**
   * Adds a statement right after `defineBackend()`, before regular post-define
   * statements. Used for DynamoDB table constructs that must precede auth overrides.
   */
  public addEarlyStatement(statement: ts.Statement): void {
    this.earlyStatements.push(statement);
  }

  /**
   * Ensures the `branchName` variable is declared exactly once in backend.ts.
   * Multiple generators (REST API, functions) may need it.
   */
  public ensureBranchName(): void {
    if (this.hasBranchName) return;
    this.hasBranchName = true;
    const branchNameDecl = factory.createVariableStatement(
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
    this.postDefineStatements.push(branchNameDecl);
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const backendTsPath = path.join(this.outputDir, 'amplify', 'backend.ts');

    return [
      {
        describe: async () => [`Generate ${backendTsPath}`],
        execute: async () => {
          const nodes: ts.Node[] = [];

          // Sort imports to match expected output order:
          // 1. Category resource imports (./auth/resource, ./data/resource, ./storage/resource)
          // 2. Function/trigger imports (./auth/*/resource, ./function/*/resource, ./storage/*/resource)
          // 3. CDK sub-module imports for constructs (aws-cdk-lib/aws-dynamodb, aws-cdk-lib/aws-lambda-*)
          // 4. @aws-amplify/backend (defineBackend)
          // 5. CDK root imports containing Duration (aws-cdk-lib)
          // 6. CDK sub-module imports for auth (aws-cdk-lib/aws-cognito) — after Duration
          // 7. Analytics imports (./analytics/*)
          this.addImport('@aws-amplify/backend', ['defineBackend']);
          const sortedImports = [...this.imports].sort((a, b) => {
            const order = (imp: { readonly source: string; identifiers: string[] }): number => {
              const s = imp.source;
              if (s === './auth/resource') return 0;
              if (s === './data/resource') return 1;
              if (s === './storage/resource') return 2;
              if (s.startsWith('./') && s.endsWith('/resource') && !s.startsWith('./analytics')) return 3;
              if (s.startsWith('aws-cdk-lib/') && s !== 'aws-cdk-lib/aws-cognito') return 4;
              if (s === '@aws-amplify/backend') return 5;
              if (s.startsWith('./analytics')) return 5.5;
              if (s === 'aws-cdk-lib' && imp.identifiers.includes('Duration')) return 6;
              if (s === 'aws-cdk-lib' && !imp.identifiers.includes('Duration')) return 4.5;
              if (s === 'aws-cdk-lib/aws-cognito') return 7;
              return 4.5;
            };
            return order(a) - order(b);
          });

          for (const imp of sortedImports) {
            nodes.push(createImportDeclaration(imp.source, imp.identifiers));
          }

          // Sort defineBackend properties: auth first, then data, storage, then functions
          const sortedProperties = [...this.defineBackendProperties].sort((a, b) => {
            const getName = (prop: ts.ObjectLiteralElementLike): string => {
              if (ts.isShorthandPropertyAssignment(prop)) return prop.name.text;
              if (ts.isPropertyAssignment(prop)) return prop.name.getText?.() ?? '';
              return '';
            };
            const order = (name: string): number => {
              if (name === 'auth') return 0;
              if (name === 'data') return 1;
              if (name === 'storage') return 2;
              return 3;
            };
            return order(getName(a)) - order(getName(b));
          });

          // const backend = defineBackend({ auth, data, storage, ... })
          const callExpr = factory.createCallExpression(factory.createIdentifier('defineBackend'), undefined, [
            factory.createObjectLiteralExpression(sortedProperties, true),
          ]);
          const backendDecl = factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [factory.createVariableDeclaration('backend', undefined, undefined, callExpr)],
              ts.NodeFlags.Const,
            ),
          );
          nodes.push(backendDecl);

          nodes.push(...this.earlyStatements);
          nodes.push(...this.postDefineStatements);

          const nodeArray = factory.createNodeArray(nodes as ts.Statement[]);
          let content = printNodes(nodeArray);

          // Add blank line between the last import and the first non-import statement
          const lines = content.split('\n');
          let lastImportIndex = -1;
          let inImport = false;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
              inImport = true;
              lastImportIndex = i;
            }
            if (inImport && lines[i].includes(' from ')) {
              lastImportIndex = i;
              inImport = false;
            }
          }
          if (lastImportIndex >= 0 && lastImportIndex < lines.length - 1 && lines[lastImportIndex + 1] !== '') {
            lines.splice(lastImportIndex + 1, 0, '');
            content = lines.join('\n');
          }

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
