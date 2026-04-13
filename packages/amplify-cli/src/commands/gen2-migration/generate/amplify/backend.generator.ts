import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../_infra/planner';
import { AmplifyMigrationOperation } from '../../_infra/operation';
import { TS } from '../_infra/ts';

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
export class BackendGenerator implements Planner {
  private readonly imports: Array<{ readonly source: string; readonly identifiers: string[] }> = [];
  private readonly defineBackendProperties: ts.ObjectLiteralElementLike[] = [];
  private readonly postDefineStatements: ts.Statement[] = [];
  private readonly earlyStatements: ts.Statement[] = [];
  private readonly refactoredResourceTypesByStack: Map<string, string[]> = new Map();
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

  /** Adds `const varName = backend.a.b.c;` after defineBackend(). */
  public addConstFromBackend(varName: string, ...path: string[]): void {
    this.postDefineStatements.push(TS.constDecl(varName, TS.propAccess('backend', ...path)));
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
    this.postDefineStatements.push(TS.constDecl('branchName', factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"')));
  }

  /**
   * Creates a per-DDB-table stack via `backend.createStack('storage' + resourceName)`.
   * Returns the variable name used to reference the stack (e.g., `storageActivityStack`).
   * Each DDB table gets its own nested stack, enabling multi-table support.
   */
  public createDynamoDBStack(resourceName: string): string {
    const varName = `storage${resourceName.charAt(0).toUpperCase()}${resourceName.slice(1)}Stack`;
    const stackExpression = factory.createCallExpression(
      TS.propAccess('backend', 'createStack') as ts.PropertyAccessExpression,
      undefined,
      [factory.createStringLiteral('storage' + resourceName)],
    );
    this.earlyStatements.push(TS.constDecl(varName, stackExpression));
    return varName;
  }

  /**
   * Emits a for-of loop as an early statement that applies
   * `addOverride('DeletionPolicy', 'Retain')` and
   * `addOverride('UpdateReplacePolicy', 'Retain')` to CfnResources of the
   * given type inside a stack referenced by a local variable.
   *
   * Used for custom stacks (e.g. DynamoDB) where the stack is not a
   * standard backend category property.
   */
  public addRetentionOverrideLoop(stackVarName: string, resourceType: string): void {
    this.addImport('aws-cdk-lib', ['CfnResource']);
    this.earlyStatements.push(BackendGenerator.createRetentionLoop(stackVarName, resourceType));
  }

  /**
   * Creates a for-of loop AST node that applies retention overrides to
   * CfnResources of a given type inside a stack.
   */
  private static createRetentionLoop(stackVarName: string, resourceType: string): ts.ForOfStatement {
    const filterCallback = factory.createArrowFunction(
      undefined,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, 'n')],
      undefined,
      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('CfnResource'), 'isCfnResource'),
        undefined,
        [factory.createIdentifier('n')],
      ),
    );

    const iterableExpr = factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier(stackVarName), 'node'),
            'findAll',
          ),
          undefined,
          [],
        ),
        'filter',
      ),
      undefined,
      [filterCallback],
    );

    const condition = factory.createBinaryExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('cfnResource'), 'cfnResourceType'),
      factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
      factory.createStringLiteral(resourceType),
    );

    const addOverrideDeletion = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('cfnResource'), 'addOverride'),
        undefined,
        [factory.createStringLiteral('DeletionPolicy'), factory.createStringLiteral('Retain')],
      ),
    );

    const addOverrideUpdate = factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('cfnResource'), 'addOverride'),
        undefined,
        [factory.createStringLiteral('UpdateReplacePolicy'), factory.createStringLiteral('Retain')],
      ),
    );

    const ifStatement = factory.createIfStatement(condition, factory.createBlock([addOverrideDeletion, addOverrideUpdate], true));

    return factory.createForOfStatement(
      undefined,
      factory.createVariableDeclarationList([factory.createVariableDeclaration('cfnResource')], ts.NodeFlags.Const),
      iterableExpr,
      factory.createBlock([ifStatement], true),
    );
  }

  /**
   * Registers CloudFormation resource types that will be refactored during
   * the migration, scoped to a specific backend stack. At the end of
   * backend.ts, a per-stack block is emitted that applies
   * `addOverride('DeletionPolicy', 'Retain')` and
   * `addOverride('UpdateReplacePolicy', 'Retain')` to all matching
   * CfnResources so they survive the stack update when Gen2 takes ownership.
   */
  public addRefactoredResourceTypes(stackName: string, types: readonly string[]): void {
    let existing = this.refactoredResourceTypesByStack.get(stackName);
    if (!existing) {
      existing = [];
      this.refactoredResourceTypesByStack.set(stackName, existing);
    }
    for (const t of types) {
      if (!existing.includes(t)) {
        existing.push(t);
      }
    }
  }

  /**
   * Assembles all accumulated imports, properties, and statements into backend.ts.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const backendTsPath = path.join(this.outputDir, 'amplify', 'backend.ts');

    return [
      {
        validate: () => undefined,
        describe: async () => ['Generate amplify/backend.ts'],
        execute: async () => {
          const nodes: ts.Node[] = [];

          // Sort imports: relative resource imports first (auth, data, storage,
          // then other resources), then CDK sub-modules, then @aws-amplify/backend,
          // then analytics, then CDK root, then CDK cognito.
          this.addImport('@aws-amplify/backend', ['defineBackend']);
          if (this.refactoredResourceTypesByStack.size > 0) {
            this.addImport('aws-cdk-lib', ['CfnResource', 'RemovalPolicy']);
          }
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
          nodes.push(TS.constDecl('backend', callExpr));

          nodes.push(...this.earlyStatements);
          nodes.push(...this.postDefineStatements);

          // Emit the per-stack retention override blocks if any types were registered.
          if (this.refactoredResourceTypesByStack.size > 0) {
            nodes.push(...this.renderRefactoredResourceTypesBlock());
          }

          const nodeArray = factory.createNodeArray(nodes as ts.Statement[]);
          let content = TS.printNodes(nodeArray);

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
  /**
   * Renders per-stack blocks that apply `addOverride('DeletionPolicy', 'Retain')`
   * and `addOverride('UpdateReplacePolicy', 'Retain')` to CfnResources whose
   * type matches the registered list for each stack.
   */
  private renderRefactoredResourceTypesBlock(): ts.Statement[] {
    const statements: ts.Statement[] = [];

    for (const [stackName, types] of this.refactoredResourceTypesByStack) {
      const filterCallback = factory.createArrowFunction(
        undefined,
        undefined,
        [factory.createParameterDeclaration(undefined, undefined, 'n')],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('CfnResource'), 'isCfnResource'),
          undefined,
          [factory.createIdentifier('n')],
        ),
      );

      // backend.<stackName>.stack.node.findAll().filter(...)
      const iterableExpr = factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createCallExpression(
            factory.createPropertyAccessExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('backend'), stackName),
                  'stack',
                ),
                'node',
              ),
              'findAll',
            ),
            undefined,
            [],
          ),
          'filter',
        ),
        undefined,
        [filterCallback],
      );

      // Build the condition: either a single === check or an .includes() check
      let condition: ts.Expression;
      if (types.length === 1) {
        condition = factory.createBinaryExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('cfnResource'), 'cfnResourceType'),
          factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
          factory.createStringLiteral(types[0]),
        );
      } else {
        condition = factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createArrayLiteralExpression(
              types.map((t) => factory.createStringLiteral(t)),
              true,
            ),
            'includes',
          ),
          undefined,
          [factory.createPropertyAccessExpression(factory.createIdentifier('cfnResource'), 'cfnResourceType')],
        );
      }

      const addOverrideDeletion = factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('cfnResource'), 'addOverride'),
          undefined,
          [factory.createStringLiteral('DeletionPolicy'), factory.createStringLiteral('Retain')],
        ),
      );

      const addOverrideUpdate = factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier('cfnResource'), 'addOverride'),
          undefined,
          [factory.createStringLiteral('UpdateReplacePolicy'), factory.createStringLiteral('Retain')],
        ),
      );

      const ifStatement = factory.createIfStatement(condition, factory.createBlock([addOverrideDeletion, addOverrideUpdate], true));

      const forOfStatement = factory.createForOfStatement(
        undefined,
        factory.createVariableDeclarationList([factory.createVariableDeclaration('cfnResource')], ts.NodeFlags.Const),
        iterableExpr,
        factory.createBlock([ifStatement], true),
      );

      statements.push(forOfStatement);
    }

    return statements;
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
