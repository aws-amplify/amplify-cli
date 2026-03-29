import chalk from 'chalk';
import CLITable from 'cli-table3';
import { DiscoveredResource } from './generate/_infra/gen1-app';

/**
 * Support level for a resource or feature dimension.
 */
export type SupportLevel = 'supported' | 'unsupported' | 'not-applicable';

interface _Assessment {
  readonly generate: SupportLevel;
  readonly refactor: SupportLevel;
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

  /** All recorded resource assessments. */
  public get resources(): readonly ResourceAssessment[] {
    return this._resources;
  }

  /** All recorded feature assessments. */
  public get features(): readonly FeatureAssessment[] {
    return this._features;
  }

  public validFor(step: 'generate' | 'refactor'): boolean {
    let valid = undefined;
    switch (step) {
      case 'generate':
        valid = this._resources.every((ar) => ar.generate !== 'unsupported') && this._features.every((fr) => fr.generate !== 'unsupported');
        break;
      case 'refactor':
        valid = this._resources.every((ar) => ar.refactor !== 'unsupported') && this._features.every((fr) => fr.refactor !== 'unsupported');
        break;
    }
    return valid;
  }

  /**
   * Renders the assessment as a string containing resource and feature tables.
   */
  public render(): string {
    const lines: string[] = [];

    lines.push('');
    lines.push(chalk.bold(chalk.cyan(`Assessment for "${this.appName}" (env: ${this.envName})`)));

    lines.push('');
    lines.push(chalk.bold('Resources'));
    lines.push('');
    lines.push(this.renderResourceTable());

    lines.push('');
    lines.push(chalk.bold('Features'));
    lines.push('');
    lines.push(this.renderFeatureTable());

    return lines.join('\n');
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
        Assessment.status(ra, 'generate'),
        Assessment.status(ra, 'refactor'),
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
      table.push([fr.feature.name, fr.feature.path, Assessment.status(fr, 'generate'), Assessment.status(fr, 'refactor')]);
    }

    return table.toString();
  }

  private static status(assessment: _Assessment, step: 'generate' | 'refactor'): string {
    let status = undefined;
    switch (step) {
      case 'generate':
        status = Assessment.statusText(assessment.generate, 'requires manual code editing');
        break;
      case 'refactor':
        status = Assessment.statusText(assessment.refactor, 'requires manual data replication');
        break;
    }
    return status;
  }

  private static statusText(level: SupportLevel, unsupportedLabel: string): string {
    let text = undefined;
    switch (level) {
      case 'supported':
        text = '✔';
        break;
      case 'unsupported':
        text = `✘ ${unsupportedLabel}`;
        break;
      case 'not-applicable':
        text = '—';
        break;
    }
    return text;
  }
}
