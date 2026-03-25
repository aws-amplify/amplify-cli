import chalk from 'chalk';
import CLITable from 'cli-table3';
import { DiscoveredResource } from './generate/_infra/gen1-app';

/**
 * Support level for a resource or feature dimension.
 */
export type SupportLevel = 'supported' | 'unsupported' | 'not-applicable';

/**
 * Per-resource assessment combining generate and refactor support.
 */
export interface ResourceAssessment {
  readonly resource: DiscoveredResource;
  readonly generate: SupportLevel;
  readonly refactor: SupportLevel;
}

/**
 * A detected sub-feature within a resource.
 */
export interface DiscoveredFeature {
  readonly name: string;
  readonly path: string;
}

/**
 * A detected sub-feature within a resource that the migration tool
 * may or may not handle.
 */
export interface FeatureAssessment {
  readonly feature: DiscoveredFeature;
  readonly generate: SupportLevel;
  readonly refactor: SupportLevel;
}

/**
 * Collector that assessors contribute to during assess().
 * Accumulates both resource-level and feature-level entries,
 * and renders both tables as a string report.
 */
export class Assessment {
  private readonly _resources: ResourceAssessment[] = [];
  private readonly _features: FeatureAssessment[] = [];

  public constructor(private readonly appName?: string, private readonly envName?: string) {}

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
   * Returns all recorded resource assessments.
   */
  public get resources(): readonly ResourceAssessment[] {
    return this._resources;
  }

  /**
   * Returns all recorded feature assessments.
   */
  public get features(): readonly FeatureAssessment[] {
    return this._features;
  }

  /**
   * Renders the assessment as a string containing resource and feature tables.
   */
  public render(): string {
    const lines: string[] = [];

    if (this.appName && this.envName) {
      lines.push('');
      lines.push(chalk.bold(chalk.cyan(`Assessment for "${this.appName}" (env: ${this.envName})`)));
    }

    if (this._resources.length > 0) {
      lines.push('');
      lines.push(chalk.bold('Resources'));
      lines.push('');
      lines.push(Assessment.renderResourceTable(this._resources));
    }

    if (this._features.length > 0) {
      lines.push('');
      lines.push(chalk.bold('Features'));
      lines.push('');
      lines.push(Assessment.renderFeatureTable(this._features));
    }

    return lines.join('\n');
  }

  private static renderResourceTable(resources: readonly ResourceAssessment[]): string {
    const table = new CLITable({
      head: ['Category', 'Resource', 'Service', 'Generate', 'Refactor'],
      style: { head: [] },
    });

    for (const a of resources) {
      table.push([
        a.resource.category,
        a.resource.resourceName,
        a.resource.service,
        Assessment.statusText(a.generate, 'manual code needed'),
        Assessment.statusText(a.refactor, 'blocks migration'),
      ]);
    }

    return table.toString();
  }

  private static renderFeatureTable(features: readonly FeatureAssessment[]): string {
    const table = new CLITable({
      head: ['Feature', 'Path', 'Generate', 'Refactor'],
      style: { head: [] },
    });

    for (const f of features) {
      table.push([f.feature.name, f.feature.path, Assessment.statusText(f.generate), Assessment.statusText(f.refactor)]);
    }

    return table.toString();
  }

  private static statusText(level: SupportLevel, unsupportedLabel?: string): string {
    switch (level) {
      case 'supported':
        return '✔';
      case 'unsupported':
        return unsupportedLabel ? `✘ ${unsupportedLabel}` : '✘';
      case 'not-applicable':
        return '—';
      default:
        throw new Error(`Unexpected support level: ${level}`);
    }
  }
}
