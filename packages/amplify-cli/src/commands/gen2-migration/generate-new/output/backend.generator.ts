import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { printNodes } from '../ts-writer';
import { constDecl, propAccess } from '../ts-factory-utils';

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
  private readonly imports: Array<{ readonly source: string; readonly identifiers: string[] }> = [];
  private readonly defineBackendProperties: ts.ObjectLiteralElementLike[] = [];
  private readonly postDefineStatements: ts.Statement[] = [];
  private readonly earlyStatements: ts.Statement[] = [];
  private readonly outputDir: string;
  private hasBranchName = false;
  private hasStorageStack = false;

  public constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Adds named imports to backend.ts, merging identifiers into an
   * existing entry when the source module already has one.
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
    this.postDefineStatements.push(constDecl('branchName', factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"')));
  }

  /**
   * Ensures the `storageStack` variable is declared exactly once in backend.ts.
   * Multiple DynamoDB generators share the same stack. When an S3 storage
   * resource exists, the stack is reused from `backend.storage.stack`;
   * otherwise a new stack is created.
   */
  public ensureStorageStack(hasS3Bucket: boolean): void {
    if (this.hasStorageStack) return;
    this.hasStorageStack = true;

    const stackExpression = hasS3Bucket
      ? propAccess('backend', 'storage', 'stack')
      : factory.createCallExpression(propAccess('backend', 'createStack') as ts.PropertyAccessExpression, undefined, [
          factory.createStringLiteral('storage'),
        ]);

    this.earlyStatements.push(constDecl('storageStack', stackExpression));
  }

  /**
   * Assembles all accumulated imports, properties, and statements into backend.ts.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const backendTsPath = path.join(this.outputDir, 'amplify', 'backend.ts');

    return [
      {
        describe: async () => ['Generate amplify/backend.ts'],
        execute: async () => {
          const nodes: ts.Node[] = [];

          // Sort imports: relative resource imports first (auth, data, storage,
          // then other resources), then CDK sub-modules, then @aws-amplify/backend,
          // then analytics, then CDK root, then CDK cognito.
          this.addImport('@aws-amplify/backend', ['defineBackend']);
          const sortedImports = [...this.imports].sort((a, b) => importOrder(a.source) - importOrder(b.source));

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
          nodes.push(constDecl('backend', callExpr));

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

/**
 * Returns a numeric sort key for import source paths.
 *
 * Groups:
 * 0 — category resource imports (./auth/resource, ./data/resource, ./storage/resource)
 * 1 — other relative resource imports (nested resource paths)
 * 2 — CDK sub-module imports except aws-cognito
 * 3 — @aws-amplify/backend
 * 4 — analytics imports
 * 5 — CDK root (aws-cdk-lib)
 * 6 — aws-cdk-lib/aws-cognito (after Duration so OAuth types appear last)
 */
function importOrder(source: string): number {
  if (source === './auth/resource') return 0;
  if (source === './data/resource') return 0.1;
  if (source === './storage/resource') return 0.2;
  if (source.startsWith('./') && source.endsWith('/resource') && !source.startsWith('./analytics')) return 1;
  if (source.startsWith('aws-cdk-lib/') && source !== 'aws-cdk-lib/aws-cognito') return 2;
  if (source === '@aws-amplify/backend') return 3;
  if (source.startsWith('./analytics')) return 4;
  if (source === 'aws-cdk-lib') return 5;
  if (source === 'aws-cdk-lib/aws-cognito') return 6;
  return 2.5;
}
