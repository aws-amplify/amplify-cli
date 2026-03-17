import { AmplifyMigrationOperation } from './_operation';
import { SpinningLogger } from './_spinning-logger';
import { printer } from '@aws-amplify/amplify-prompts';
import chalk from 'chalk';
import CLITable from 'cli-table3';

/** Internal type used only for rendering the validation summary table. */
interface ValidationSummaryEntry {
  readonly description: string;
  readonly valid: boolean;
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
      entries.push({ description: validation.description, valid: result.valid });
    }
    this.logger.succeed('→ Validating complete');
    this.renderValidationResults(entries);
    return entries.every((e) => e.valid);
  }

  /**
   * Renders the operations summary and implications to the terminal.
   */
  public async describe(): Promise<void> {
    const descriptions: string[] = [];
    for (const op of this.operations) {
      descriptions.push(...(await op.describe()));
    }

    if (descriptions.length > 0) {
      printer.info(chalk.bold(chalk.underline('Operations Summary')));
      printer.blankLine();
      for (const description of descriptions) {
        printer.info(`• ${description}`);
      }
      printer.blankLine();
    }

    if (this.implications.length > 0) {
      printer.info(chalk.bold(chalk.underline('Implications')));
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
