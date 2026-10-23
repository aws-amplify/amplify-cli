import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../_common/planner';
import { AmplifyMigrationOperation } from '../../_common/operation';
import { TS } from '../ts';
import {
  BackendRenderer,
  BackendRenderOptions,
  NamespaceImport,
  DefineBackendEntry,
  PostDefineBackendCall,
  EscapeHatchCall,
} from './backend.renderer';
import { SpinningLogger } from '../../_common/spinning-logger';

/**
 * Accumulates namespace imports, defineBackend entries, escape-hatch
 * calls, and post-refactor calls from category generators, then
 * delegates rendering to BackendRenderer and writes backend.ts.
 */
export class BackendGenerator implements Planner {
  private readonly namespaceImports: NamespaceImport[] = [];
  private readonly namedImports: Record<string, Set<string>> = {};
  private readonly defineBackendEntries: DefineBackendEntry[] = [];
  private readonly applyEscapeHatchesCalls: EscapeHatchCall[] = [];
  private readonly postRefactorCalls: string[] = [];
  private readonly postDefineBackendCalls: PostDefineBackendCall[] = [];
  private readonly postDefineBackendStatements: string[] = [];
  private readonly outputDir: string;
  private readonly renderer = new BackendRenderer();
  private readonly logger: SpinningLogger;

  public constructor(outputDir: string, logger: SpinningLogger) {
    this.outputDir = outputDir;
    this.logger = logger;
  }

  /**
   * Adds a namespace import: `import * as alias from 'source';`
   */
  public addNamespaceImport(alias: string, source: string): void {
    this.namespaceImports.push({ alias, source });
  }

  /**
   * Adds a named import: `import { name } from 'source';`. Deduplicated per
   * source, so multiple callers requesting the same symbol collapse to one
   * import specifier (e.g. several categories emitting IAM policy statements).
   */
  public addNamedImport(source: string, name: string): void {
    if (!this.namedImports[source]) {
      this.namedImports[source] = new Set();
    }
    this.namedImports[source].add(name);
  }

  /**
   * Adds an entry to the `defineBackend({ key: alias.exportName })` call.
   */
  public addDefineBackendEntry(key: string, alias: string, exportName: string): void {
    this.defineBackendEntries.push({ key, alias, exportName });
  }

  /**
   * Adds an `alias.applyEscapeHatches(backend, ...extraArgs)` call.
   * Extra arguments (e.g. variable names) are passed through as-is.
   */
  public addApplyEscapeHatchesCall(call: EscapeHatchCall): void {
    this.applyEscapeHatchesCalls.push(call);
  }

  /**
   * Adds a statement inside the `postRefactor()` function body.
   * The statement string is emitted as-is (e.g. `storage.postRefactor(backend)`).
   */
  public addPostRefactorCall(statement: string): void {
    this.postRefactorCalls.push(statement);
  }

  /**
   * Adds a post-define call: `const varName = expression;`
   * These appear right after defineBackend and before postRefactor.
   */
  public addPostDefineBackendCall(variableName: string, expression: string): void {
    this.postDefineBackendCalls.push({ variableName, expression });
  }

  /**
   * Adds a plain post-define statement (no variable assignment).
   * These appear right after defineBackend and before postRefactor.
   */
  public addPostDefineBackendStatement(statement: string): void {
    this.postDefineBackendStatements.push(statement);
  }

  /**
   * Builds render options from accumulated data and delegates to the renderer.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const backendTsPath = path.join(this.outputDir, 'amplify', 'backend.ts');

    return [
      {
        validate: () => undefined,
        describe: async () => ['Generate amplify/backend.ts'],
        execute: async () => {
          const options: BackendRenderOptions = {
            namespaceImports: this.namespaceImports,
            namedImports: this.namedImports,
            defineBackendEntries: this.defineBackendEntries,
            postDefineBackendCalls: this.postDefineBackendCalls,
            postDefineBackendStatements: this.postDefineBackendStatements,
            postRefactorCalls: this.postRefactorCalls,
            escapeHatchCalls: this.applyEscapeHatchesCalls,
          };

          this.logger.info('Rendering backend.ts');
          const nodes = this.renderer.render(options);
          const content = TS.printNodes(nodes, 120);

          await fs.mkdir(path.dirname(backendTsPath), { recursive: true });
          await fs.writeFile(backendTsPath, content, 'utf-8');
        },
      },
    ];
  }
}
