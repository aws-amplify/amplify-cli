import chalk from 'chalk';
import { printer } from '@aws-amplify/amplify-prompts';
import { DiscoveredResource, SupportResponse } from './generate-new/_infra/gen1-app';

/**
 * Per-resource assessment combining generate and refactor support.
 */
export interface ResourceAssessment {
  readonly resource: DiscoveredResource;
  generate: SupportResponse;
  refactor: SupportResponse;
}

/**
 * Collector that steps contribute to during execute().
 * Each step calls record() for every discovered resource,
 * reporting whether it supports that resource.
 */
export class Assessment {
  private readonly _entries = new Map<string, ResourceAssessment>();

  constructor(private readonly appName: string, private readonly envName: string) {}

  /**
   * Records a step's support for a discovered resource.
   */
  public record(step: 'generate' | 'refactor', resource: DiscoveredResource, response: SupportResponse): void {
    const key = `${resource.category}:${resource.resourceName}`;
    if (!this._entries.has(key)) {
      this._entries.set(key, {
        resource,
        generate: { supported: false, notes: [] },
        refactor: { supported: false, notes: [] },
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- entry just created above if missing
    this._entries.get(key)![step] = response;
  }

  /**
   * Returns all recorded assessments.
   */
  public get entries(): ReadonlyMap<string, ResourceAssessment> {
    return this._entries;
  }

  /**
   * Renders the full assessment: header, per-category tables, summary, and verdict.
   */
  public render(): void {
    const assessments = [...this._entries.values()];

    const categories = new Map<string, ResourceAssessment[]>();
    for (const a of assessments) {
      const list = categories.get(a.resource.category) ?? [];
      list.push(a);
      categories.set(a.resource.category, list);
    }

    const blockers = assessments.filter((a) => !a.refactor.supported);
    const generateWarnings = assessments.filter((a) => !a.generate.supported);
    const subFeatureWarnings = assessments.filter((a) => a.generate.notes.length > 0 || a.refactor.notes.length > 0);

    printer.blankLine();
    printer.info(`Assessment for "${this.appName}" (env: ${this.envName})`);
    printer.blankLine();

    for (const [category, items] of categories) {
      Assessment.renderCategory(category, items);
    }

    Assessment.renderSummary(categories, blockers, generateWarnings, subFeatureWarnings);
  }

  private static renderCategory(category: string, assessments: readonly ResourceAssessment[]): void {
    printer.info(chalk.bold(category.charAt(0).toUpperCase() + category.slice(1)));

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

  private static renderSummary(
    categories: ReadonlyMap<string, readonly ResourceAssessment[]>,
    blockers: readonly ResourceAssessment[],
    generateWarnings: readonly ResourceAssessment[],
    subFeatureWarnings: readonly ResourceAssessment[],
  ): void {
    const allResources = [...categories.values()].flat();
    const total = allResources.length;
    const fullySupported = allResources.filter(
      (a) => a.generate.supported && a.refactor.supported && a.generate.notes.length === 0 && a.refactor.notes.length === 0,
    ).length;
    const categoryCount = categories.size;
    const blocked = blockers.length > 0;

    printer.info(`Summary: ${fullySupported}/${total} resources across ${categoryCount} categories fully supported.`);
    printer.blankLine();

    if (generateWarnings.length > 0) {
      const names = generateWarnings.map((a) => `${a.resource.category}/${a.resource.resourceName}`).join(', ');
      printer.info(chalk.yellow(`⚠ ${generateWarnings.length} resource(s) do not support code generation:`));
      printer.info(chalk.yellow(`    ${names}`));
      printer.info(chalk.yellow('  You will need to write Gen2 code for these manually'));
      printer.info(chalk.yellow('  after the generate step.'));
      printer.blankLine();
    }

    if (subFeatureWarnings.length > 0) {
      const names = subFeatureWarnings
        .map((a) => {
          const notes = [...a.generate.notes, ...a.refactor.notes].join(', ');
          return `${a.resource.category}/${a.resource.resourceName} (${notes})`;
        })
        .join(', ');
      printer.info(chalk.yellow(`⚠ ${subFeatureWarnings.length} resource(s) have unsupported sub-features:`));
      printer.info(chalk.yellow(`    ${names}`));
      printer.info(chalk.yellow('  Generated code will be incomplete. Review and add'));
      printer.info(chalk.yellow('  missing configuration manually after the generate step.'));
      printer.blankLine();
    }

    if (blockers.length > 0) {
      const names = blockers.map((a) => `${a.resource.category}/${a.resource.resourceName}`).join(', ');
      printer.info(chalk.red(`✘ ${blockers.length} resource(s) have stateful data that cannot be refactored:`));
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
