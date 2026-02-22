import { copySync, FileDiff } from './directories';
import * as fs from 'fs-extra';
import chalk from 'chalk';

/**
 * Configuration properties for creating a Snapshot instance.
 */
export interface SnapshotProps {
  readonly appName: string;
  readonly inputPath: string;
  readonly expectedPath: string;
  readonly actualPath: string;
  readonly ignorePatterns: RegExp[];
  readonly differences: FileDiff[];
}

/**
 * Represents the result of comparing actual migration output against expected snapshots.
 *
 * This class encapsulates the differences found between the actual and expected directories,
 * and provides methods for generating human-readable reports and updating snapshots.
 */
export class Snapshot {
  /**
   * Creates a new Snapshot instance.
   *
   * @param props - Configuration properties including paths and detected differences.
   */
  constructor(private readonly props: SnapshotProps) {}

  /**
   * Indicates whether there are any differences between actual and expected output.
   */
  public get changed() {
    return this.props.differences.length > 0;
  }

  /**
   * Generates a formatted report of all differences between actual and expected output.
   *
   * The report includes:
   * - Path information (actual, expected, input directories)
   * - Summary counts of extra, missing, and modified files
   * - Detailed diff output for modified files
   *
   * @returns A formatted string report with color-coded output for terminal display.
   */
  public report() {
    const extraFiles = this.props.differences.filter((f) => f.diffType === 'extra');
    const missingFiles = this.props.differences.filter((f) => f.diffType === 'missing');
    const modifiedFiles = this.props.differences.filter((f) => f.diffType === 'modified');

    const report = [
      '',
      `----------- Snapshot Report (${this.props.appName}) -----------`,
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

    return report.join('\n');
  }

  /**
   * Updates the expected snapshot directory with the actual output.
   *
   * This method removes the existing expected directory and replaces it with
   * the contents of the actual directory. Typically called when running tests
   * in snapshot update mode (`--updateSnapshot`).
   */
  public update() {
    console.log(`Updating snapshot: ${this.props.expectedPath}`);
    fs.rmSync(this.props.expectedPath, { recursive: true });
    copySync(this.props.actualPath, this.props.expectedPath);
  }
}
