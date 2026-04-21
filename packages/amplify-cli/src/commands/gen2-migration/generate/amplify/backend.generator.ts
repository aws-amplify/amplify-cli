import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../_infra/planner';
import { AmplifyMigrationOperation } from '../../_infra/operation';
import { TS } from '../_infra/ts';
import {
  BackendRenderer,
  BackendRenderOptions,
  NamespaceImport,
  DefineBackendEntry,
  PostDefineBackendCall,
  EscapeHatchCall,
} from './backend.renderer';

/**
 * Accumulates namespace imports, defineBackend entries, escape-hatch
 * calls, and post-refactor calls from category generators, then
 * delegates rendering to BackendRenderer and writes backend.ts.
 *
 * @example Generated output:
 *
 * ```ts
 * import * as auth from './auth/resource';
 * import * as data from './data/resource';
 * import * as storage from './storage/resource';
 * import * as myFunc from './function/myFunc/resource';
 * import * as analytics from './analytics/resource';
 * import { defineBackend } from '@aws-amplify/backend';
 *
 * const backend = defineBackend({
 *   auth: auth.auth,
 *   data: data.data,
 *   storage: storage.storage,
 *   myFunc: myFunc.myFunc,
 * });
 *
 * export type Backend = typeof backend;
 *
 * const analyticsResult = analytics.defineAnalytics(backend);
 *
 * export function postRefactor() {
 *   storage.postRefactor(backend);
 *   analytics.postRefactor(analyticsResult);
 * }
 *
 * auth.applyEscapeHatches(backend);
 * data.applyEscapeHatches(backend);
 * storage.applyEscapeHatches(backend);
 * myFunc.applyEscapeHatches(backend, analyticsResult);
 *
 * // Uncomment after refactor
 * // postRefactor();
 * ```
 */
export class BackendGenerator implements Planner {
  private readonly namespaceImports: NamespaceImport[] = [];
  private readonly defineBackendEntries: DefineBackendEntry[] = [];
  private readonly applyEscapeHatchesCalls: EscapeHatchCall[] = [];
  private readonly postRefactorCalls: string[] = [];
  private readonly postDefineBackendCalls: PostDefineBackendCall[] = [];
  private readonly postDefineBackendStatements: string[] = [];
  private readonly outputDir: string;
  private readonly renderer = new BackendRenderer();

  public constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Adds a namespace import: `import * as alias from 'source';`
   */
  public addNamespaceImport(alias: string, source: string): void {
    this.namespaceImports.push({ alias, source });
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
            defineBackendEntries: this.defineBackendEntries,
            postDefineBackendCalls: this.postDefineBackendCalls,
            postDefineBackendStatements: this.postDefineBackendStatements,
            postRefactorCalls: this.postRefactorCalls,
            escapeHatchCalls: this.applyEscapeHatchesCalls,
          };

          const nodes = this.renderer.render(options);
          const content = TS.printNodes(nodes, 120);

          await fs.mkdir(path.dirname(backendTsPath), { recursive: true });
          await fs.writeFile(backendTsPath, content, 'utf-8');
        },
      },
    ];
  }
}
