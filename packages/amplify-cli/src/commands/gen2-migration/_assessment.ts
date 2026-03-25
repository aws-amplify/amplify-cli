import chalk from 'chalk';
import { printer } from '@aws-amplify/amplify-prompts';
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
 * then renders both tables and a summary verdict.
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
   * Displays the assessment as resource and feature tables with a summary.
   */
  public display(): void {
    printer.blankLine();
    printer.info(chalk.bold(chalk.cyan(`Assessment for "${this.appName}" (env: ${this.envName})`)));

    if (this._resources.length > 0) {
      printer.blankLine();
      this.renderResourceTable();
    }

    if (this._features.length > 0) {
      printer.blankLine();
      this.renderFeatureTable();
    }
  }

  private renderResourceTable(): void {
    printer.info(chalk.bold('Resources'));
    printer.blankLine();

    const table = new CLITable({
      head: ['Category', 'Resource', 'Service', 'Generate', 'Refactor'],
      style: { head: [] },
    });

    for (const a of this._resources) {
      table.push([
        a.resource.category,
        a.resource.resourceName,
        a.resource.service,
        Assessment.statusText(a.generate, 'manual code needed'),
        Assessment.statusText(a.refactor, 'blocks migration'),
      ]);
    }

    printer.info(table.toString());
  }

  private renderFeatureTable(): void {
    printer.info(chalk.bold('Features'));
    printer.blankLine();

    const table = new CLITable({
      head: ['Feature', 'Path', 'Generate', 'Refactor'],
      style: { head: [] },
    });

    for (const f of this._features) {
      table.push([f.feature.name, f.feature.path, Assessment.statusText(f.generate), Assessment.statusText(f.refactor)]);
    }

    printer.info(table.toString());
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
