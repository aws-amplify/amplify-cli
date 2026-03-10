import { MigrationApp } from './app';
import { FileDiff } from './directories';
import chalk from 'chalk';

/**
 * Configuration for creating a snapshot comparison report.
 */
export interface ReportProps {
  /**
   * The migration app this report belongs to.
   */
  readonly app: MigrationApp;

  /**
   * The list of file differences found during comparison.
   */
  readonly differences: FileDiff[];

  /**
   * Path to the app's input directory (the Gen1 project files).
   */
  readonly inputPath: string;

  /**
   * Path to the expected snapshot directory
   * (e.g., `_snapshot.post.generate/` or `_snapshot.post.refactor/`).
   */
  readonly expectedPath: string;

  /**
   * Path to the actual output directory (the temp directory where codegen wrote files).
   */
  readonly actualPath: string;

  /**
   * Regex patterns that were excluded from the comparison.
   */
  readonly ignorePatterns: RegExp[];
}
/**
 * A human-readable report of differences between actual and expected snapshot output.
 *
 * Created by `Snapshot.compare()` after diffing the two directories. The test
 * asserts `report.hasChanges` is falsy; when it's truthy, `report.print()` outputs
 * a color-coded terminal report showing exactly what changed.
 *
 * Example test usage:
 * ```typescript
 * const report = await app.snapshots.generate.compare(process.cwd());
 * if (report.hasChanges) {
 *   report.print(); // shows colored diff in terminal
 * }
 * expect(report.hasChanges).toBeFalsy();
 * ```
 */
export class Report {
  constructor(private readonly props: ReportProps) {}

  /**
   * Indicates whether there are any differences between actual and expected output.
   */
  public get hasChanges() {
    return this.props.differences.length > 0;
  }

  /**
   * Prints a formatted report of all differences between actual and expected output.
   *
   * The report includes:
   * - Path information (actual, expected, input directories)
   * - Summary counts of extra, missing, and modified files
   * - Detailed diff output for modified files
   */
  public print() {
    const extraFiles = this.props.differences.filter((f) => f.diffType === 'extra');
    const missingFiles = this.props.differences.filter((f) => f.diffType === 'missing');
    const modifiedFiles = this.props.differences.filter((f) => f.diffType === 'modified');

    const report = [
      '',
      `----------- Snapshot Report (${this.props.app.name}) -----------`,
      '',
      chalk.bold('Properties'),
      '',
      ` • Actual: ${this.props.actualPath}`,
      ` • Expected: ${this.props.expectedPath}`,
      ` • Input: ${this.props.inputPath}`,
      ` • Ignored: ${this.props.ignorePatterns}`,
      '',
      chalk.bold('Summary'),
      '',
      ` • Extra files: ${extraFiles.length}`,
      ` • Missing files: ${missingFiles.length}`,
      ` • Modified files: ${modifiedFiles.length}`,
      '',
      chalk.bold('Details'),
      '',
    ];

    for (const difference of extraFiles) {
      report.push(chalk.bold(chalk.green(`(+) ${difference.relativePath} (${difference.diffType})`)));
      report.push('');
    }

    for (const difference of missingFiles) {
      report.push(chalk.bold(chalk.red(`(-) ${difference.relativePath} (${difference.diffType})`)));
      report.push('');
    }

    for (const difference of modifiedFiles) {
      report.push(chalk.bold(chalk.yellow(`(~) ${difference.relativePath} (${difference.diffType})`)));
      report.push('');
      report.push(difference.diff!);
    }

    console.log(report.join('\n'));
  }
}
