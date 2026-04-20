import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../_infra/planner';
import { AmplifyMigrationOperation } from '../../_infra/operation';
import { TS } from '../_infra/ts';
import { BackendRenderer, BackendRenderOptions } from './backend.renderer';

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
 * delegates rendering to BackendRenderer and writes backend.ts.
 */
export class BackendGenerator implements Planner {
  private readonly namespaceImports: NamespaceImport[] = [];
  private readonly defineBackendEntries: DefineBackendEntry[] = [];
  private readonly applyEscapeHatchesCalls: string[] = [];
  private readonly postRefactorCalls: string[] = [];
  private readonly postDefineCalls: PostDefineCall[] = [];
  private readonly outputDir: string;
  private readonly renderer = new BackendRenderer();
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
            postDefineCalls: this.postDefineCalls,
            postRefactorCalls: this.postRefactorCalls,
            escapeHatchCalls: this.applyEscapeHatchesCalls.map((alias) => ({
              alias,
              needsAnalyticsArg: this.needsAnalyticsArg(alias),
            })),
            analyticsResultVar: this.analyticsResultVar,
          };

          const nodes = this.renderer.render(options);
          const content = TS.printNodes(nodes, 120);

          await fs.mkdir(path.dirname(backendTsPath), { recursive: true });
          await fs.writeFile(backendTsPath, content, 'utf-8');
        },
      },
    ];
  }

  /**
   * Determines if a function alias needs the analytics result argument.
   */
  private needsAnalyticsArg(alias: string): boolean {
    if (alias === this.analyticsResultAlias) return false;
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
