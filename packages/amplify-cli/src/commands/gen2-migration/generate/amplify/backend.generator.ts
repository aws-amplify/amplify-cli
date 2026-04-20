import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs/promises';
import * as prettier from 'prettier';
import { Planner } from '../../_infra/planner';
import { AmplifyMigrationOperation } from '../../_infra/operation';

/**
 * An entry in the defineBackend({ ... }) object literal.
 */
interface DefineBackendEntry {
  /** Property key in defineBackend (e.g. 'auth'). */
  readonly key: string;
  /** Namespace alias (e.g. 'auth'). */
  readonly alias: string;
  /** Exported name from the resource module (e.g. 'auth'). */
  readonly exportName: string;
}

/**
 * A namespace import: `import * as alias from source;`
 */
interface NamespaceImport {
  readonly alias: string;
  readonly source: string;
}

/**
 * A post-define call: `const varName = alias.funcName(backend);`
 */
interface PostDefineCall {
  readonly variableName: string;
  readonly expression: string;
}

/**
 * Accumulates namespace imports, defineBackend entries, escape-hatch
 * calls, and post-refactor calls from category generators, then
 * writes the final `backend.ts` file using string assembly.
 *
 * This is the ONE place where string assembly is acceptable — it
 * assembles the top-level file structure, not TypeScript AST nodes.
 */
export class BackendGenerator implements Planner {
  private readonly namespaceImports: NamespaceImport[] = [];
  private readonly defineBackendEntries: DefineBackendEntry[] = [];
  private readonly applyEscapeHatchesCalls: string[] = [];
  private readonly postRefactorCalls: string[] = [];
  private readonly postDefineCalls: PostDefineCall[] = [];
  private readonly outputDir: string;
  private analyticsResultAlias: string | undefined;
  private analyticsResultVar: string | undefined;

  public constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Adds a namespace import: `import * as alias from 'source';`
   */
  public addNamespaceImport(alias: string, source: string): void {
    if (!this.namespaceImports.some((i) => i.alias === alias)) {
      this.namespaceImports.push({ alias, source });
    }
  }

  /**
   * Adds an entry to the `defineBackend({ key: alias.exportName })` call.
   */
  public addDefineBackendEntry(key: string, alias: string, exportName: string): void {
    if (!this.defineBackendEntries.some((e) => e.key === key)) {
      this.defineBackendEntries.push({ key, alias, exportName });
    }
  }

  /**
   * Adds `alias.applyEscapeHatches(backend)` or
   * `alias.applyEscapeHatches(backend, analyticsResult)` to the
   * escape-hatches section.
   */
  public addApplyEscapeHatchesCall(alias: string): void {
    this.applyEscapeHatchesCalls.push(alias);
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
  public addPostDefineCall(variableName: string, expression: string): void {
    this.postDefineCalls.push({ variableName, expression });
  }

  /**
   * Adds a plain post-define statement (no variable assignment).
   * These appear right after defineBackend and before postRefactor.
   */
  public addPostDefineStatement(statement: string): void {
    this.postDefineCalls.push({ variableName: '', expression: statement });
  }

  /**
   * Records the analytics namespace alias so that escape-hatch calls
   * for functions that depend on analytics can pass `analyticsResult`.
   */
  public addAnalyticsResultAlias(alias: string): void {
    this.analyticsResultAlias = alias;
  }

  /**
   * Sets the variable name that holds the analytics result
   * (e.g. 'analyticsResult').
   */
  public setAnalyticsResultVar(varName: string): void {
    this.analyticsResultVar = varName;
  }

  /**
   * Returns the analytics result variable name, if set.
   */
  public getAnalyticsResultVar(): string | undefined {
    return this.analyticsResultVar;
  }

  /**
   * Returns the analytics result alias, if set.
   */
  public getAnalyticsResultAlias(): string | undefined {
    return this.analyticsResultAlias;
  }

  /**
   * Assembles all accumulated data into backend.ts using string assembly.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const backendTsPath = path.join(this.outputDir, 'amplify', 'backend.ts');

    return [
      {
        validate: () => undefined,
        describe: async () => ['Generate amplify/backend.ts'],
        execute: async () => {
          const lines: string[] = [];

          // 1. Namespace imports sorted by category order
          const sortedImports = [...this.namespaceImports].sort((a, b) => namespaceImportOrder(a.source) - namespaceImportOrder(b.source));
          for (const imp of sortedImports) {
            lines.push(`import * as ${imp.alias} from '${imp.source}';`);
          }
          lines.push(`import { defineBackend } from '@aws-amplify/backend';`);
          lines.push('');

          // 2. defineBackend call
          const sortedEntries = [...this.defineBackendEntries].sort((a, b) => defineBackendOrder(a.key) - defineBackendOrder(b.key));
          lines.push('const backend = defineBackend({');
          for (const entry of sortedEntries) {
            lines.push(`  ${entry.key}: ${entry.alias}.${entry.exportName},`);
          }
          lines.push('});');
          lines.push('');

          // 3. Export Backend type
          lines.push('export type Backend = typeof backend;');
          lines.push('');

          // 4. Post-define calls (analytics, geo, DynamoDB tables)
          for (const call of this.postDefineCalls) {
            if (call.variableName) {
              lines.push(`const ${call.variableName} = ${call.expression};`);
            } else {
              lines.push(`${call.expression};`);
            }
          }
          if (this.postDefineCalls.length > 0) {
            lines.push('');
          }

          // 5. postRefactor function
          const sortedPostRefactorCalls = [...this.postRefactorCalls].sort((a, b) => postRefactorOrder(a) - postRefactorOrder(b));
          lines.push('export function postRefactor() {');
          for (const stmt of sortedPostRefactorCalls) {
            lines.push(`  ${stmt}`);
          }
          lines.push('}');
          lines.push('');

          // 6. applyEscapeHatches calls
          const sortedEscapeHatches = [...this.applyEscapeHatchesCalls].sort((a, b) => escapeHatchOrder(a) - escapeHatchOrder(b));
          for (const alias of sortedEscapeHatches) {
            if (this.analyticsResultAlias && this.needsAnalyticsArg(alias)) {
              lines.push(`${alias}.applyEscapeHatches(backend, ${this.analyticsResultVar});`);
            } else {
              lines.push(`${alias}.applyEscapeHatches(backend);`);
            }
          }
          lines.push('');

          // 7. Commented postRefactor call
          lines.push('// Uncomment after refactor');
          lines.push('// postRefactor();');
          lines.push('');

          let content = lines.join('\n');
          content = await prettier.format(content, {
            parser: 'typescript',
            singleQuote: true,
            tabWidth: 2,
            printWidth: 120,
          });

          await fs.mkdir(path.dirname(backendTsPath), { recursive: true });
          await fs.writeFile(backendTsPath, content, 'utf-8');
        },
      },
    ];
  }

  /**
   * Determines if a function alias needs the analytics result argument.
   * This is true when the function's resource.ts has an applyEscapeHatches
   * that takes an analytics parameter (kinesis-related functions).
   */
  private needsAnalyticsArg(alias: string): boolean {
    // The analytics alias itself doesn't get applyEscapeHatches
    if (alias === this.analyticsResultAlias) return false;
    // Functions that were registered as needing analytics will be tracked
    // by the function generator setting a flag
    return this.analyticsEscapeHatchAliases.has(alias);
  }

  private readonly analyticsEscapeHatchAliases = new Set<string>();

  /**
   * Marks a function alias as needing the analytics result in its
   * applyEscapeHatches call.
   */
  public markNeedsAnalyticsArg(alias: string): void {
    this.analyticsEscapeHatchAliases.add(alias);
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
 * Matches the defineBackend order: auth, data, storage, then functions.
 */
function escapeHatchOrder(alias: string): number {
  if (alias === 'auth') return 0;
  if (alias === 'data') return 1;
  if (alias === 'storage') return 2;
  return 3;
}

/**
 * Sort order for postRefactor calls.
 * S3 storage first, then DynamoDB tables, then analytics.
 */
function postRefactorOrder(statement: string): number {
  if (statement.includes('storage.postRefactor')) return 0;
  if (statement.includes('storageActivity') || statement.includes('storageBookmarks')) return 1;
  if (statement.includes('analytics.postRefactor')) return 2;
  return 3;
}
