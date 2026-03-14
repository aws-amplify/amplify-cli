import chalk from 'chalk';
import { printer } from '@aws-amplify/amplify-prompts';
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
 * Complete assessment result for a Gen1 application.
 */
export interface AssessmentResult {
  readonly appName: string;
  readonly envName: string;
  readonly categories: ReadonlyMap<string, readonly ResourceAssessment[]>;
  readonly blocked: boolean;
  readonly blockers: readonly ResourceAssessment[];
  readonly generateWarnings: readonly ResourceAssessment[];
  readonly subFeatureWarnings: readonly ResourceAssessment[];
}

/**
 * Evaluates migration readiness for a Gen1 application by querying
 * the generate and refactor steps for each discovered resource.
 */
export class Assessment {
  constructor(private readonly gen1App: Gen1App, private readonly appName: string, private readonly envName: string) {}

  /**
   * Discovers all resources and evaluates support for each.
   */
  public evaluate(): AssessmentResult {
    const resources = this.gen1App.discover();
    const assessments: ResourceAssessment[] = resources.map((r) => ({
      resource: r,
      generate: AmplifyMigrationGenerateStep.assess(this.gen1App, r),
      refactor: AmplifyMigrationRefactorStep.assess(r),
    }));

    const categories = new Map<string, ResourceAssessment[]>();
    for (const a of assessments) {
      const list = categories.get(a.resource.category) ?? [];
      list.push(a);
      categories.set(a.resource.category, list);
    }

    const blockers = assessments.filter((a) => !a.refactor.supported);
    const generateWarnings = assessments.filter((a) => !a.generate.supported);
    const subFeatureWarnings = assessments.filter((a) => a.generate.notes.length > 0 || a.refactor.notes.length > 0);

    return {
      appName: this.appName,
      envName: this.envName,
      categories,
      blocked: blockers.length > 0,
      blockers,
      generateWarnings,
      subFeatureWarnings,
    };
  }
}

/**
 * Renders an AssessmentResult to the terminal.
 */
export class AssessmentRenderer {
  /**
   * Renders the full assessment output: header, per-category tables,
   * summary, and verdict.
   */
  public static render(result: AssessmentResult): void {
    printer.blankLine();
    printer.info(`Assessment for "${result.appName}" (env: ${result.envName})`);
    printer.blankLine();

    for (const [category, assessments] of result.categories) {
      AssessmentRenderer.renderCategory(category, assessments);
    }

    AssessmentRenderer.renderSummary(result);
  }

  private static renderCategory(category: string, assessments: readonly ResourceAssessment[]): void {
    printer.info(chalk.bold(category.charAt(0).toUpperCase() + category.slice(1)));

    const rows = assessments.map((a) => ({
      resource: a.resource.resourceName,
      service: a.resource.service,
      generate: AssessmentRenderer.icon(a.generate),
      refactor: AssessmentRenderer.icon(a.refactor),
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

    // Footnotes for sub-feature warnings
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

  private static renderSummary(result: AssessmentResult): void {
    const total = [...result.categories.values()].reduce((sum, list) => sum + list.length, 0);
    const allResources = [...result.categories.values()].flat();
    const fullySupported = allResources.filter(
      (a) => a.generate.supported && a.refactor.supported && a.generate.notes.length === 0 && a.refactor.notes.length === 0,
    ).length;
    const categoryCount = result.categories.size;

    printer.info(`Summary: ${fullySupported}/${total} resources across ${categoryCount} categories fully supported.`);
    printer.blankLine();

    if (result.generateWarnings.length > 0) {
      const names = result.generateWarnings.map((a) => `${a.resource.category}/${a.resource.resourceName}`).join(', ');
      printer.info(chalk.yellow(`⚠ ${result.generateWarnings.length} resource(s) do not support code generation:`));
      printer.info(chalk.yellow(`    ${names}`));
      printer.info(chalk.yellow('  You will need to write Gen2 code for these manually'));
      printer.info(chalk.yellow('  after the generate step.'));
      printer.blankLine();
    }

    if (result.subFeatureWarnings.length > 0) {
      const names = result.subFeatureWarnings
        .map((a) => {
          const notes = [...a.generate.notes, ...a.refactor.notes].join(', ');
          return `${a.resource.category}/${a.resource.resourceName} (${notes})`;
        })
        .join(', ');
      printer.info(chalk.yellow(`⚠ ${result.subFeatureWarnings.length} resource(s) have unsupported sub-features:`));
      printer.info(chalk.yellow(`    ${names}`));
      printer.info(chalk.yellow('  Generated code will be incomplete. Review and add'));
      printer.info(chalk.yellow('  missing configuration manually after the generate step.'));
      printer.blankLine();
    }

    if (result.blockers.length > 0) {
      const names = result.blockers.map((a) => `${a.resource.category}/${a.resource.resourceName}`).join(', ');
      printer.info(chalk.red(`✘ ${result.blockers.length} resource(s) have stateful data that cannot be refactored:`));
      printer.info(chalk.red(`    ${names}`));
      printer.info(chalk.red('  Automatic migration cannot proceed until refactoring'));
      printer.info(chalk.red('  support is added for these resources. Stateful resources'));
      printer.info(chalk.red('  require refactoring to avoid data loss.'));
      printer.blankLine();
    }

    if (result.blocked) {
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
