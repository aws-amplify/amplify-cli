import ts from 'typescript';
import { newLineIdentifier, TS } from '../_infra/ts';

const factory = ts.factory;

/**
 * Options for rendering the backend.ts file.
 */
export interface BackendRenderOptions {
  readonly namespaceImports: ReadonlyArray<{ readonly alias: string; readonly source: string }>;
  readonly defineBackendEntries: ReadonlyArray<{ readonly key: string; readonly alias: string; readonly exportName: string }>;
  readonly postDefineCalls: ReadonlyArray<{ readonly variableName: string; readonly expression: string }>;
  readonly postRefactorCalls: readonly string[];
  readonly escapeHatchCalls: ReadonlyArray<{ readonly alias: string; readonly needsAnalyticsArg: boolean }>;
  readonly analyticsResultVar?: string;
}

/**
 * Renders the backend.ts file using the TypeScript AST API.
 * Pure — no side effects, no file I/O.
 */
export class BackendRenderer {
  /**
   * Produces the complete TypeScript AST for backend.ts.
   */
  public render(options: BackendRenderOptions): ts.NodeArray<ts.Node> {
    const nodes: ts.Node[] = [];

    // 1. Namespace imports sorted by category order
    const sortedImports = [...options.namespaceImports].sort((a, b) => namespaceImportOrder(a.source) - namespaceImportOrder(b.source));
    for (const imp of sortedImports) {
      nodes.push(this.renderNamespaceImport(imp.alias, imp.source));
    }
    nodes.push(this.renderDefineBackendImport());
    nodes.push(newLineIdentifier);

    // 2. defineBackend call
    const sortedEntries = [...options.defineBackendEntries].sort((a, b) => defineBackendOrder(a.key) - defineBackendOrder(b.key));
    nodes.push(this.renderDefineBackendCall(sortedEntries));
    nodes.push(newLineIdentifier);

    // 3. Export Backend type
    nodes.push(this.renderBackendTypeExport());
    nodes.push(newLineIdentifier);

    // 4. Post-define calls
    for (const call of options.postDefineCalls) {
      nodes.push(this.renderPostDefineCall(call));
    }
    if (options.postDefineCalls.length > 0) {
      nodes.push(newLineIdentifier);
    }

    // 5. postRefactor function
    const sortedPostRefactorCalls = [...options.postRefactorCalls].sort((a, b) => postRefactorOrder(a) - postRefactorOrder(b));
    nodes.push(this.renderPostRefactorFunction(sortedPostRefactorCalls));
    nodes.push(newLineIdentifier);

    // 6. applyEscapeHatches calls
    const sortedEscapeHatches = [...options.escapeHatchCalls].sort((a, b) => escapeHatchOrder(a.alias) - escapeHatchOrder(b.alias));
    for (const entry of sortedEscapeHatches) {
      nodes.push(this.renderEscapeHatchCall(entry, options.analyticsResultVar));
    }
    nodes.push(newLineIdentifier);

    // 7. Commented postRefactor call
    nodes.push(this.renderCommentedPostRefactor());

    return factory.createNodeArray(nodes);
  }

  private renderNamespaceImport(alias: string, source: string): ts.ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier(alias))),
      factory.createStringLiteral(source),
    );
  }

  private renderDefineBackendImport(): ts.ImportDeclaration {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,
        factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('defineBackend'))]),
      ),
      factory.createStringLiteral('@aws-amplify/backend'),
    );
  }

  private renderDefineBackendCall(
    entries: ReadonlyArray<{ readonly key: string; readonly alias: string; readonly exportName: string }>,
  ): ts.VariableStatement {
    const properties = entries.map((entry) =>
      factory.createPropertyAssignment(factory.createIdentifier(entry.key), TS.propAccess(entry.alias, entry.exportName)),
    );
    const objectLiteral = factory.createObjectLiteralExpression(properties, true);
    const callExpr = factory.createCallExpression(factory.createIdentifier('defineBackend'), undefined, [objectLiteral]);
    return TS.declareConst('backend', callExpr);
  }

  private renderBackendTypeExport(): ts.TypeAliasDeclaration {
    return factory.createTypeAliasDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      'Backend',
      undefined,
      factory.createTypeQueryNode(factory.createIdentifier('backend')),
    );
  }

  private renderPostDefineCall(call: { readonly variableName: string; readonly expression: string }): ts.Node {
    if (call.variableName) {
      return TS.declareConst(call.variableName, factory.createIdentifier(call.expression));
    }
    return factory.createExpressionStatement(factory.createIdentifier(call.expression));
  }

  private renderPostRefactorFunction(calls: readonly string[]): ts.FunctionDeclaration {
    const statements = calls.map((stmt) => factory.createExpressionStatement(factory.createIdentifier(stmt)));
    return factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      'postRefactor',
      undefined,
      [],
      undefined,
      factory.createBlock(statements, true),
    );
  }

  private renderEscapeHatchCall(
    entry: { readonly alias: string; readonly needsAnalyticsArg: boolean },
    analyticsResultVar: string | undefined,
  ): ts.ExpressionStatement {
    const args: ts.Expression[] = [factory.createIdentifier('backend')];
    if (entry.needsAnalyticsArg && analyticsResultVar) {
      args.push(factory.createIdentifier(analyticsResultVar));
    }
    return factory.createExpressionStatement(
      factory.createCallExpression(TS.propAccess(entry.alias, 'applyEscapeHatches') as ts.PropertyAccessExpression, undefined, args),
    );
  }

  private renderCommentedPostRefactor(): ts.EmptyStatement {
    const emptyStmt = factory.createEmptyStatement();
    ts.addSyntheticLeadingComment(emptyStmt, ts.SyntaxKind.SingleLineCommentTrivia, ' Uncomment after refactor', true);
    ts.addSyntheticLeadingComment(emptyStmt, ts.SyntaxKind.SingleLineCommentTrivia, ' postRefactor();', true);
    return emptyStmt;
  }
}

/**
 * Sort order for namespace imports in backend.ts.
 */
function namespaceImportOrder(source: string): number {
  if (source === './auth/resource') return 0;
  if (source === './data/resource') return 0.1;
  if (source === './storage/resource') return 0.2;
  if (source.startsWith('./storage/')) return 0.3;
  if (source.startsWith('./function/') || source.startsWith('./auth/')) return 1;
  if (source.startsWith('./api/')) return 1.5;
  if (source.startsWith('./analytics/')) return 2;
  if (source.startsWith('./geo/')) return 2.5;
  return 3;
}

/**
 * Sort order for defineBackend entries.
 */
function defineBackendOrder(key: string): number {
  if (key === 'auth') return 0;
  if (key === 'data') return 1;
  if (key === 'storage') return 2;
  return 3;
}

/**
 * Sort order for applyEscapeHatches calls.
 */
function escapeHatchOrder(alias: string): number {
  if (alias === 'auth') return 0;
  if (alias === 'data') return 1;
  if (alias === 'storage') return 2;
  return 3;
}

/**
 * Sort order for postRefactor calls.
 */
function postRefactorOrder(statement: string): number {
  if (statement.includes('storage.postRefactor')) return 0;
  if (statement.includes('storageActivity') || statement.includes('storageBookmarks')) return 1;
  if (statement.includes('analytics.postRefactor')) return 2;
  return 3;
}
