import { copySync, diff } from './directories';
import * as fs from 'fs-extra';
import { MigrationApp } from './app';
import { Report } from './report';

/**
 * Configuration properties for creating a Snapshot instance.
 */
export interface SnapshotProps {
  /**
   * The migration app this snapshot belongs to.
   */
  readonly app: MigrationApp;
  /**
   * Path to the input directory.
   *
   * For `snapshots.generate`, this is `_snapshot.pre.generate/`.
   * For `snapshots.refactor`, this is `_snapshot.pre.refactor/`.
   */
  readonly inputPath: string;
  /**
   * Path to the expected output directory (the golden snapshot).
   *
   * For `snapshots.generate`, this is `_snapshot.post.generate/`.
   * For `snapshots.refactor`, this is `_snapshot.post.refactor/`.
   */
  readonly expectedPath: string;
}

/**
 * Manages snapshot comparison and updating for a migration app.
 *
 * Each `MigrationApp` has two snapshots: `snapshots.generate` (for the `generate`
 * command) and `snapshots.refactor` (for the `refactor` command). This class
 * provides:
 *
 * - `compare(actualDir)` — diffs the actual codegen output against the expected
 *   snapshot directory and returns a {@link Report}.
 * - `update(actualDir)` — replaces the expected snapshot with the actual output,
 *   used when running tests with `--updateSnapshot` (Jest's `-u` flag).
 *
 * The snapshot workflow in a test looks like:
 *
 * ```typescript
 * // 1. Run the codegen (writes files to cwd, which is a temp dir)
 * await prepare(app.logger, app.id, app.environmentName, app.region);
 *
 * // 2. Compare actual output against expected snapshot
 * const report = await app.snapshots.generate.compare(process.cwd());
 *
 * // 3. If updating snapshots, overwrite expected with actual
 * if (report.hasChanges && isUpdatingSnapshots) {
 *   app.snapshots.generate.update(process.cwd());
 * }
 *
 * // 4. Assert no differences
 * expect(report.hasChanges).toBeFalsy();
 * ```
 */
export class Snapshot {
  /**
   * Creates a new Snapshot instance.
   *
   * @param props - Configuration properties including paths and detected differences.
   */
  constructor(public readonly props: SnapshotProps) {}

  /**
   * Compares the contents of an actual directory against the expected directory of this snapshot.
   *
   * This method performs a recursive diff between the provided directory and the app's
   * expected snapshot directory, returning a {@link Report} that contains the differences
   * and provides methods for reporting and updating.
   *
   * @param actualDir - The directory containing the actual output to compare.
   * @param ignorePatterns - Optional array of regex patterns for files/directories to exclude from comparison.
   *                         The `node_modules` pattern is always added automatically.
   * @returns A {@link Report} containing the comparison results, which can be used to
   *          check for changes, print a diff report, or update the expected snapshot.
   */
  public async compare(actualDir: string, ignorePatterns?: RegExp[]): Promise<Report> {
    const fullIgnorePatterns = [...(ignorePatterns ?? []), /node_modules/];
    const differences = await diff({ expectedDir: this.props.expectedPath, actualDir, ignorePatterns: fullIgnorePatterns });

    // copy the temporary actual path to repo (ignored) for easy manual comparison
    const ignoredActualPath = `${this.props.expectedPath}.actual`;
    if (fs.existsSync(ignoredActualPath)) {
      fs.rmdirSync(ignoredActualPath, { recursive: true });
    }
    copySync({ src: actualDir, dest: ignoredActualPath, ignorePatterns: fullIgnorePatterns });

    return new Report({
      app: this.props.app,
      expectedPath: this.props.expectedPath,
      inputPath: this.props.inputPath,
      ignorePatterns: fullIgnorePatterns,
      differences,
      actualPath: actualDir,
    });
  }

  /**
   * Updates the expected snapshot directory with the actual output.
   *
   * This method removes the existing expected directory and replaces it with
   * the contents of the actual directory. Typically called when running tests
   * in snapshot update mode (`--updateSnapshot`).
   */
  public update(actualDir: string) {
    console.log(`Updating snapshot: ${this.props.expectedPath}`);
    fs.rmSync(this.props.expectedPath, { recursive: true });
    copySync({ src: actualDir, dest: this.props.expectedPath });
  }
}
