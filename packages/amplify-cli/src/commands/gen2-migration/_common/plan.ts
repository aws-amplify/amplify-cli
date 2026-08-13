import { AmplifyMigrationOperation } from './operation';
import { SpinningLogger } from './spinning-logger';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import CLITable from 'cli-table3';

/** Internal type used only for rendering the validation summary. */
interface ValidationSummaryEntry {
  readonly description: string;
  readonly valid: boolean;
  readonly report?: string;
}

/**
 * Configuration for constructing a Plan.
 */
export interface PlanProps {
  readonly operations: AmplifyMigrationOperation[];
  readonly logger: SpinningLogger;
  readonly title: string;
  readonly implications?: string[];
}

/**
 * Encapsulates a list of operations and exposes describe/validate/execute.
 * Individual operations are an internal detail.
 */
export class Plan {
  private readonly operations: AmplifyMigrationOperation[];
  private readonly logger: SpinningLogger;
  private readonly title: string;
  private readonly implications: string[];

  constructor(props: PlanProps) {
    this.operations = props.operations;
    this.logger = props.logger;
    this.title = props.title;
    this.implications = props.implications ?? [];
  }

  /**
   * Appends an operation to the plan.
   */
  public addOperation(operation: AmplifyMigrationOperation): void {
    this.operations.push(operation);
  }

  /**
   * Runs validations with spinner context, renders the summary table,
   * and returns whether all validations passed.
   */
  public async validate(): Promise<boolean> {
    this.logger.start('Validating');
    const entries: ValidationSummaryEntry[] = [];
    for (const op of this.operations) {
      const validation = op.validate();
      if (!validation) continue;
      this.logger.push(validation.description);
      const result = await validation.run();
      this.logger.pop();
      entries.push({ description: validation.description, valid: result.valid, report: result.report });
    }
    this.logger.succeed('Validating complete');
    this.renderValidationResults(entries);
    return entries.every((e) => e.valid);
  }

  /**
   * Renders the operations summary and implications to the terminal.
   * Operations with a resource are grouped under a resource header;
   * ungrouped operations render as a flat list.
   */
  public async describe(): Promise<void> {
    const grouped = new Map<string, string[]>();

    for (const op of this.operations) {
      const lines = await op.describe();
      if (lines.length === 0) continue;
      const label = op.resource ? `Resource: ${op.resource.category}/${op.resource.resourceName} (${op.resource.service})` : 'Project';
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)!.push(...lines);
    }

    if (grouped.size > 0) {
      printer.info(chalk.bold(chalk.underline('Operations Summary')));

      for (const [label, descriptions] of grouped) {
        printer.blankLine();
        printer.info(chalk.green(chalk.bold(label)));
        printer.blankLine();
        let step = 1;
        for (const description of descriptions) {
          printer.info(`${step}. ${description}`);
          step++;
        }
      }
    }

    if (this.implications.length > 0) {
      printer.blankLine();
      printer.info(chalk.bold(chalk.underline(chalk.yellow('Implications'))));
      printer.blankLine();
      for (const implication of this.implications) {
        printer.info(`• ${implication}`);
      }
      printer.blankLine();
    }
  }

  /**
   * Executes all operations sequentially.
   */
  public async execute(): Promise<void> {
    this.logger.info(this.title);
    for (const op of this.operations) {
      await op.execute();
    }
    printer.blankLine();
    printer.success('Done');
  }

  private renderValidationResults(entries: ValidationSummaryEntry[]): void {
    if (entries.length === 0) return;

    const failed = entries.filter((e) => !e.valid && e.report);
    if (failed.length > 0) {
      printer.blankLine();
      printer.info(chalk.bold(chalk.underline('Failed Validations Report')));
      printer.blankLine();
      for (let i = 0; i < failed.length; i++) {
        printer.info(chalk.bold(chalk.red(`✘ ${failed[i].description}`)));
        printer.blankLine();
        printer.info(failed[i].report!.trimStart());
        if (i < failed.length - 1) {
          printer.blankLine();
        }
      }
    }

    printer.blankLine();
    printer.info(chalk.bold(chalk.underline('Validations Summary')));
    printer.blankLine();
    const table = new CLITable({
      head: ['Validation', 'Status'],
      style: { head: [] },
    });
    for (const entry of entries) {
      const status = entry.valid ? chalk.green('✔ Passed') : chalk.red('✘ Failed');
      table.push([entry.description, status]);
    }
    printer.info(table.toString());
  }
}
