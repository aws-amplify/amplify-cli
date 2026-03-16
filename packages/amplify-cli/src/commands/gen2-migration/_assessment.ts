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
 * Collector that steps contribute to during assess().
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
        generate: { supported: false },
        refactor: { supported: false },
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
   * Displays the assessment as a single flat table with a compact summary.
   */
  public display(): void {
    const assessments = [...this._entries.values()];

    printer.blankLine();
    printer.info(chalk.bold(`Assessment for "${this.appName}" (env: ${this.envName})`));
    printer.blankLine();

    Assessment.renderTable(assessments);
    printer.blankLine();
    Assessment.renderSummary(assessments);
  }

  private static renderTable(assessments: readonly ResourceAssessment[]): void {
    const rows = assessments.map((a) => ({
      category: a.resource.category,
      resource: a.resource.resourceName,
      service: a.resource.service,
      generate: Assessment.statusText(a.generate, 'manual code needed'),
      refactor: Assessment.statusText(a.refactor, 'blocks migration'),
    }));

    const colWidths = {
      category: Math.max(8, ...rows.map((r) => r.category.length)) + 2,
      resource: Math.max(8, ...rows.map((r) => r.resource.length)) + 2,
      service: Math.max(7, ...rows.map((r) => r.service.length)) + 2,
      generate: Math.max(8, ...rows.map((r) => r.generate.length)) + 2,
      refactor: Math.max(8, ...rows.map((r) => r.refactor.length)) + 2,
    };

    const hr = (char: string, left: string, mid: string, right: string) =>
      `${left}${''.padEnd(colWidths.category, char)}${mid}${''.padEnd(colWidths.resource, char)}${mid}${''.padEnd(
        colWidths.service,
        char,
      )}${mid}${''.padEnd(colWidths.generate, char)}${mid}${''.padEnd(colWidths.refactor, char)}${right}`;

    const row = (cat: string, res: string, svc: string, gen: string, ref: string) =>
      `│ ${cat.padEnd(colWidths.category - 2)} │ ${res.padEnd(colWidths.resource - 2)} │ ${svc.padEnd(
        colWidths.service - 2,
      )} │ ${gen.padEnd(colWidths.generate - 2)} │ ${ref.padEnd(colWidths.refactor - 2)} │`;

    printer.info(hr('─', '┌', '┬', '┐'));
    printer.info(row('Category', 'Resource', 'Service', 'Generate', 'Refactor'));
    printer.info(hr('─', '├', '┼', '┤'));
    for (const r of rows) {
      printer.info(row(r.category, r.resource, r.service, r.generate, r.refactor));
    }
    printer.info(hr('─', '└', '┴', '┘'));
  }

  private static renderSummary(assessments: readonly ResourceAssessment[]): void {
    const refactorUnsupported = assessments.filter((a) => !a.refactor.supported).length;

    if (refactorUnsupported > 0) {
      printer.info(chalk.red('✘ Migration blocked.'));
    } else {
      printer.info(chalk.green('✔ Migration can proceed.'));
    }
  }

  private static statusText(response: SupportResponse, unsupportedLabel: string): string {
    if (!response.supported) return `✘ ${unsupportedLabel}`;
    return '✔';
  }
}
