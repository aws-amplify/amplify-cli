import ts from 'typescript';
import { newLineIdentifier, TS } from '../ts';

const factory = ts.factory;

/**
 * A namespace import: `import * as alias from 'source';`
 */
export interface NamespaceImport {
  readonly alias: string;
  readonly source: string;
}

/**
 * An entry in the `defineBackend({ ... })` object literal.
 */
export interface DefineBackendEntry {
  readonly key: string;
  readonly alias: string;
  readonly exportName: string;
}

/**
 * A post-defineBackend const declaration: `const varName = expression;`
 */
export interface PostDefineBackendCall {
  readonly variableName: string;
  readonly expression: string;
}

/**
 * An `alias.applyEscapeHatches(backend, ...extraArgs)` call.
 */
export interface EscapeHatchCall {
  readonly alias: string;
  readonly extraArgs: readonly string[];
}

/**
 * Options for rendering the backend.ts file.
 */
export interface BackendRenderOptions {
  readonly namespaceImports: readonly NamespaceImport[];
  readonly defineBackendEntries: readonly DefineBackendEntry[];
  readonly postDefineBackendCalls: readonly PostDefineBackendCall[];
  readonly postDefineBackendStatements: readonly string[];
  readonly postRefactorCalls: readonly string[];
  readonly escapeHatchCalls: readonly EscapeHatchCall[];
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

    // 1. Namespace imports
    for (const imp of options.namespaceImports) {
      nodes.push(this.renderNamespaceImport(imp.alias, imp.source));
    }
    nodes.push(this.renderDefineBackendImport());
    nodes.push(TS.namedImport('aws-cdk-lib', 'Tags'));
    nodes.push(newLineIdentifier);

    // 2. defineBackend call
    nodes.push(this.renderDefineBackendCall(options.defineBackendEntries));
    nodes.push(newLineIdentifier);

    // 3. Export Backend type
    nodes.push(this.renderBackendTypeExport());
    nodes.push(newLineIdentifier);

    // 4. Post-define calls and statements
    for (const call of options.postDefineBackendCalls) {
      nodes.push(TS.declareConst(call.variableName, factory.createIdentifier(call.expression)));
    }
    for (const statement of options.postDefineBackendStatements) {
      nodes.push(factory.createExpressionStatement(factory.createIdentifier(statement)));
    }
    if (options.postDefineBackendCalls.length > 0 || options.postDefineBackendStatements.length > 0) {
      nodes.push(newLineIdentifier);
    }

    // 5. applyEscapeHatches calls
    for (const entry of options.escapeHatchCalls) {
      nodes.push(this.renderEscapeHatchCall(entry));
    }
    nodes.push(newLineIdentifier);

    // 6. postRefactor function (after escape hatches, just before the comment)
    nodes.push(this.renderPostRefactorFunction(options.postRefactorCalls));
    nodes.push(newLineIdentifier);

    // 7. Commented postRefactor call
    nodes.push(this.renderCommentedPostRefactor());

    return factory.createNodeArray(nodes);
  }

  private renderNamespaceImport(alias: string, source: string): ts.ImportDeclaration {
    return TS.namespaceImport(alias, source);
  }

  private renderDefineBackendImport(): ts.ImportDeclaration {
    return TS.namedImport('@aws-amplify/backend', 'defineBackend');
  }

  private renderDefineBackendCall(entries: readonly DefineBackendEntry[]): ts.VariableStatement {
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

  private renderPostRefactorFunction(calls: readonly string[]): ts.FunctionDeclaration {
    const statements = calls.map((statement) => factory.createExpressionStatement(factory.createIdentifier(statement)));
    // Always add Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true') as the last statement
    statements.push(
      factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createPropertyAccessExpression(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(factory.createIdentifier('Tags'), factory.createIdentifier('of')),
              undefined,
              [factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('stack'))],
            ),
            factory.createIdentifier('add'),
          ),
          undefined,
          [factory.createStringLiteral('gen2-migration/post-refactor'), factory.createStringLiteral('true')],
        ),
      ),
    );
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

  private renderEscapeHatchCall(entry: EscapeHatchCall): ts.ExpressionStatement {
    const args: ts.Expression[] = [factory.createIdentifier('backend')];
    for (const arg of entry.extraArgs) {
      args.push(factory.createIdentifier(arg));
    }
    return factory.createExpressionStatement(
      factory.createCallExpression(TS.propAccess(entry.alias, 'applyEscapeHatches') as ts.PropertyAccessExpression, undefined, args),
    );
  }

  private renderCommentedPostRefactor(): ts.EmptyStatement {
    const emptyStatement = factory.createEmptyStatement();
    ts.addSyntheticLeadingComment(emptyStatement, ts.SyntaxKind.SingleLineCommentTrivia, ' Uncomment after refactor', true);
    ts.addSyntheticLeadingComment(emptyStatement, ts.SyntaxKind.SingleLineCommentTrivia, ' postRefactor();', true);
    return emptyStatement;
  }
}
