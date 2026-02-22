import { FileDiff } from './directories';
import chalk from 'chalk';

export interface SnapshotProps {
  readonly appName: string;
  readonly inputPath: string;
  readonly expectedPath: string;
  readonly actualPath: string;
  readonly ignorePatterns: RegExp[];
  readonly differences: FileDiff[];
}

export class Snapshot {
  constructor(private readonly props: SnapshotProps) {}

  public get changed() {
    return this.props.differences.length > 0;
  }

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
}
