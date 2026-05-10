import chalk from 'chalk';
import CLITable from 'cli-table3';
import { DiscoveredResource } from '../_common/gen1-app';
import { AmplifyFault } from '@aws-amplify/amplify-cli-core';
const GUIDE_LINK = 'https://docs.amplify.aws/react/start/migrate-to-gen2/feature-matrix/';

/**
 * Support level for a resource or feature dimension.
 */
export type SupportLevel = 'supported' | 'unsupported' | 'not-applicable';

/**
 * Support entry combining a level with an optional note.
 * The note is displayed in the assessment table when the level is unsupported.
 */
export interface Support {
  readonly level: SupportLevel;
  readonly note?: string;
}

/**
 * Shorthand for a supported entry.
 */
export const supported = (): Support => ({ level: 'supported' });

/**
 * Shorthand for an unsupported entry with a note.
 */
export const unsupported = (note: string): Support => ({ level: 'unsupported', note });

/**
 * Shorthand for a not-applicable entry.
 */
export const notApplicable = (): Support => ({ level: 'not-applicable' });

interface _Assessment {
  readonly generate: Support;
  readonly refactor: Support;
}

/**
 * Per-resource assessment combining generate and refactor support.
 */
export interface ResourceAssessment extends _Assessment {
  readonly resource: DiscoveredResource;
}

/**
 * A detected sub-feature within a resource that the migration tool
 * may or may not handle.
 */
export interface FeatureAssessment extends _Assessment {
  readonly feature: DiscoveredFeature;
}

/**
 * A detected sub-feature within a resource.
 */
export interface DiscoveredFeature {
  readonly name: string;
  readonly path: string;
}

/**
 * Collector that assessors contribute to during assess().
 * Accumulates both resource-level and feature-level entries,
 * and renders both tables as a string report.
 */
export class Assessment {
  private readonly _resources: ResourceAssessment[] = [];
  private readonly _features: FeatureAssessment[] = [];

  public constructor(private readonly appName: string, private readonly envName: string) {}

  /**
   * Records support for a discovered resource.
   */
  public recordResource(resource: ResourceAssessment): void {
    this._resources.push(resource);
  }

  /**
   * Records a detected feature that the migration tool does not fully support.
   */
  public recordFeature(feature: FeatureAssessment): void {
    this._features.push(feature);
  }

  /**
   * All recorded resource assessments.
   */
  public get resources(): readonly ResourceAssessment[] {
    return this._resources;
  }

  /**
   * All recorded feature assessments.
   */
  public get features(): readonly FeatureAssessment[] {
    return this._features;
  }

  /**
   * Returns the support level for a specific resource in the given step.
   */
  // eslint-disable-next-line consistent-return -- exhaustive switch; compiler enforces all cases
  public of(resource: DiscoveredResource, step: 'generate' | 'refactor'): Support {
    const entry = this._resources.find(
      (ra) => ra.resource.category === resource.category && ra.resource.resourceName === resource.resourceName,
    );
    if (!entry) {
      throw new AmplifyFault('ResourceAssessmentNotFoundFault', {
        message: `No assessment recorded for resource '${resource.category}/${resource.resourceName}'`,
      });
    }
    switch (step) {
      case 'generate':
        return entry.generate;
      case 'refactor':
        return entry.refactor;
    }
  }

  /**
   * Returns true if all resources and features are supported for the given step.
   */
  // eslint-disable-next-line consistent-return -- exhaustive switch; compiler enforces all cases
  public validFor(step: 'generate' | 'refactor'): boolean {
    switch (step) {
      case 'generate':
        return (
          this._resources.every((ar) => ar.generate.level !== 'unsupported') &&
          this._features.every((fr) => fr.generate.level !== 'unsupported')
        );
      case 'refactor':
        return (
          this._resources.every((ar) => ar.refactor.level !== 'unsupported') &&
          this._features.every((fr) => fr.refactor.level !== 'unsupported')
        );
    }
  }

  /**
   * Renders the assessment as a string containing resource and feature tables.
   */
  public render(): string {
    const lines: string[] = [];

    lines.push('');
    lines.push(chalk.bold(chalk.cyan(`Assessment For Migrating "${this.appName}" (env: ${this.envName})`)));

    if (this._resources.length > 0) {
      lines.push('');
      lines.push(chalk.bold('Resources'));
      lines.push('');
      lines.push(this.renderResourceTable());
      lines.push('');
    }

    if (this._features.length > 0) {
      lines.push(chalk.bold('Advanced Features'));
      lines.push('');
      lines.push(this.renderFeatureTable());
      lines.push('');
    }

    if (this.hasUnsupported()) {
      lines.push(
        chalk.yellow('During migration, unsupported resources/features can be skipped by passing --skip-validations to the command.'),
      );
      lines.push('');
    }

    lines.push(chalk.yellow('⚠️ Some features may not be reported by this assessment. More details are available in the migration guide.'));
    lines.push('');
    lines.push(chalk.yellow(GUIDE_LINK));
    lines.push('');

    return lines.join('\n');
  }

  private hasUnsupported(): boolean {
    return (
      this._resources.some((ra) => ra.generate.level === 'unsupported' || ra.refactor.level === 'unsupported') ||
      this._features.some((fr) => fr.generate.level === 'unsupported' || fr.refactor.level === 'unsupported')
    );
  }

  private renderResourceTable(): string {
    const table = new CLITable({
      head: ['Category', 'Service', 'Resource', 'Generate', 'Refactor'],
      style: { head: [] },
    });

    for (const ra of this._resources) {
      table.push([
        ra.resource.category,
        ra.resource.service,
        ra.resource.resourceName,
        Assessment.supportText(ra.generate),
        Assessment.supportText(ra.refactor),
      ]);
    }

    return table.toString();
  }

  private renderFeatureTable(): string {
    const table = new CLITable({
      head: ['Name', 'Path', 'Generate', 'Refactor'],
      style: { head: [] },
    });

    for (const fr of this._features) {
      table.push([fr.feature.name, fr.feature.path, Assessment.supportText(fr.generate), Assessment.supportText(fr.refactor)]);
    }

    return table.toString();
  }

  // eslint-disable-next-line consistent-return -- exhaustive switch; compiler enforces all cases
  private static supportText(support: Support): string {
    switch (support.level) {
      case 'supported':
        return '✔';
      case 'unsupported':
        return support.note ? `✘ ${support.note}` : '✘';
      case 'not-applicable':
        return '— (not needed)';
    }
  }
}
