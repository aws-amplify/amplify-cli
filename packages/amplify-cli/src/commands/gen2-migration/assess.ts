import chalk from 'chalk';
import { printer } from '@aws-amplify/amplify-prompts';
import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { AwsClients } from './aws-clients';
import { Gen1App, DiscoveredResource, SupportResponse } from './generate-new/_infra/gen1-app';
import { AmplifyMigrationGenerateStep } from './generate';
import { AmplifyMigrationRefactorStep } from './refactor-new';

/**
 * Per-resource assessment combining generate and refactor support.
 */
export interface ResourceAssessment {
  readonly resource: DiscoveredResource;
  readonly generate: SupportResponse;
  readonly refactor: SupportResponse;
}

/**
 * Migration step that evaluates readiness by querying the generate
 * and refactor steps for each discovered resource. Read-only — rollback
 * is not applicable.
 */
export class AmplifyMigrationAssessStep extends AmplifyMigrationStep {
  public async executeImplications(): Promise<string[]> {
    return ['Display migration readiness assessment (read-only, no changes made)'];
  }

  public async rollbackImplications(): Promise<string[]> {
    return [];
  }

  public async executeValidate(): Promise<void> {
    return;
  }

  public async rollbackValidate(): Promise<void> {
    return;
  }

  /**
   * Returns a single operation that evaluates and renders the assessment.
   */
  public async execute(): Promise<AmplifyMigrationOperation[]> {
    const clients = new AwsClients({ region: this.region });
    const gen1App = await Gen1App.create({ appId: this.appId, region: this.region, envName: this.currentEnvName, clients });

    const resources = gen1App.discover();
    const resourceAssessments: ResourceAssessment[] = resources.map((r) => ({
      resource: r,
      generate: AmplifyMigrationGenerateStep.assess(gen1App, r),
      refactor: AmplifyMigrationRefactorStep.assess(r),
    }));

    const assessment = new Assessment(this.appName, this.currentEnvName, resourceAssessments);

    return [
      {
        validate: async () => {
          return;
        },
        describe: async () => ['Assess migration readiness'],
        execute: async () => {
          assessment.render();
        },
      },
    ];
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    return [];
  }
}

/**
 * Holds the assessed resource data and renders the assessment to the terminal.
 */
class Assessment {
  private readonly categories: ReadonlyMap<string, readonly ResourceAssessment[]>;
  private readonly blockers: readonly ResourceAssessment[];
  private readonly generateWarnings: readonly ResourceAssessment[];
  private readonly subFeatureWarnings: readonly ResourceAssessment[];

  constructor(private readonly appName: string, private readonly envName: string, assessments: readonly ResourceAssessment[]) {
    const categories = new Map<string, ResourceAssessment[]>();
    for (const a of assessments) {
      const list = categories.get(a.resource.category) ?? [];
      list.push(a);
      categories.set(a.resource.category, list);
    }
    this.categories = categories;
    this.blockers = assessments.filter((a) => !a.refactor.supported);
    this.generateWarnings = assessments.filter((a) => !a.generate.supported);
    this.subFeatureWarnings = assessments.filter((a) => a.generate.notes.length > 0 || a.refactor.notes.length > 0);
  }

  /**
   * Renders the full assessment: header, per-category tables, summary, and verdict.
   */
  public render(): void {
    printer.blankLine();
    printer.info(`Assessment for "${this.appName}" (env: ${this.envName})`);
    printer.blankLine();

    for (const [category, assessments] of this.categories) {
      this.renderCategory(category, assessments);
    }

    this.renderSummary();
  }

  private renderCategory(category: string, assessments: readonly ResourceAssessment[]): void {
    printer.info(chalk.bold(category.charAt(0).toUpperCase() + category.slice(1)));
    printer.info('');

    const rows = assessments.map((a) => ({
      resource: a.resource.resourceName,
      service: a.resource.service,
      generate: Assessment.icon(a.generate),
      refactor: Assessment.icon(a.refactor),
    }));

    const colWidths = {
      resource: Math.max(8, ...rows.map((r) => r.resource.length)) + 2,
      service: Math.max(7, ...rows.map((r) => r.service.length)) + 2,
      generate: 10,
      refactor: 10,
    };

    const hr = (char: string, left: string, mid: string, right: string) =>
      `${left}${''.padEnd(colWidths.resource, char)}${mid}${''.padEnd(colWidths.service, char)}${mid}${''.padEnd(
        colWidths.generate,
        char,
      )}${mid}${''.padEnd(colWidths.refactor, char)}${right}`;

    const row = (r: string, s: string, g: string, rf: string) =>
      `│ ${r.padEnd(colWidths.resource - 2)} │ ${s.padEnd(colWidths.service - 2)} │ ${g.padEnd(colWidths.generate - 2)} │ ${rf.padEnd(
        colWidths.refactor - 2,
      )} │`;

    printer.info(hr('─', '┌', '┬', '┐'));
    printer.info(row('Resource', 'Service', 'Generate', 'Refactor'));
    printer.info(hr('─', '├', '┼', '┤'));
    for (const r of rows) {
      printer.info(row(r.resource, r.service, r.generate, r.refactor));
    }
    printer.info(hr('─', '└', '┴', '┘'));

    const footnotes = assessments.filter((a) => a.generate.notes.length > 0 || a.refactor.notes.length > 0);
    for (const a of footnotes) {
      const allNotes = [...a.generate.notes, ...a.refactor.notes];
      printer.info(`  ⚠ ${a.resource.resourceName}:`);
      for (const note of allNotes) {
        printer.info(`    - ${note}`);
      }
    }

    printer.blankLine();
  }

  private renderSummary(): void {
    const allResources = [...this.categories.values()].flat();
    const total = allResources.length;
    const fullySupported = allResources.filter(
      (a) => a.generate.supported && a.refactor.supported && a.generate.notes.length === 0 && a.refactor.notes.length === 0,
    ).length;
    const categoryCount = this.categories.size;
    const blocked = this.blockers.length > 0;

    printer.info(`Summary: ${fullySupported}/${total} resources across ${categoryCount} categories fully supported.`);
    printer.blankLine();

    if (this.generateWarnings.length > 0) {
      const names = this.generateWarnings.map((a) => `${a.resource.category}/${a.resource.resourceName}`).join(', ');
      printer.info(chalk.yellow(`⚠ ${this.generateWarnings.length} resource(s) do not support code generation:`));
      printer.info(chalk.yellow(`    ${names}`));
      printer.info(chalk.yellow('  You will need to write Gen2 code for these manually'));
      printer.info(chalk.yellow('  after the generate step.'));
      printer.blankLine();
    }

    if (this.subFeatureWarnings.length > 0) {
      const names = this.subFeatureWarnings
        .map((a) => {
          const notes = [...a.generate.notes, ...a.refactor.notes].join(', ');
          return `${a.resource.category}/${a.resource.resourceName} (${notes})`;
        })
        .join(', ');
      printer.info(chalk.yellow(`⚠ ${this.subFeatureWarnings.length} resource(s) have unsupported sub-features:`));
      printer.info(chalk.yellow(`    ${names}`));
      printer.info(chalk.yellow('  Generated code will be incomplete. Review and add'));
      printer.info(chalk.yellow('  missing configuration manually after the generate step.'));
      printer.blankLine();
    }

    if (this.blockers.length > 0) {
      const names = this.blockers.map((a) => `${a.resource.category}/${a.resource.resourceName}`).join(', ');
      printer.info(chalk.red(`✘ ${this.blockers.length} resource(s) have stateful data that cannot be refactored:`));
      printer.info(chalk.red(`    ${names}`));
      printer.info(chalk.red('  Automatic migration cannot proceed until refactoring'));
      printer.info(chalk.red('  support is added for these resources. Stateful resources'));
      printer.info(chalk.red('  require refactoring to avoid data loss.'));
      printer.blankLine();
    }

    if (blocked) {
      printer.info(chalk.red('✘ Migration blocked.'));
    } else {
      printer.info(chalk.green('✔ Migration can proceed.'));
    }
  }

  private static icon(response: SupportResponse): string {
    if (!response.supported) return '   ✘';
    if (response.notes.length > 0) return '   ⚠';
    return '   ✔';
  }
}
