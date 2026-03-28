import chalk from 'chalk';
import CLITable from 'cli-table3';
import { DiscoveredResource } from './generate/_infra/gen1-app';

type GEN2_MIGRATION_STEP = 'generate' | 'refactor' | 'all';

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

  public validFor(step: 'generate' | 'refactor'): boolean {
    let valid = undefined;
    switch (step) {
      case 'generate':
        valid = this._resources.every((ar) => ar.generate === 'supported') && this._features.every((fr) => fr.generate === 'supported');
        break;
      case 'refactor':
        valid = this._resources.every((ar) => ar.refactor === 'supported') && this._features.every((fr) => fr.refactor === 'supported');
        break;
    }
    return valid;
  }

  public reportFor(step: GEN2_MIGRATION_STEP): string {
    return this.render(step);
  }

  /**
   * Renders the assessment as a string containing resource and feature tables.
   */
  public render(step: GEN2_MIGRATION_STEP): string {
    const lines: string[] = [];

    lines.push('');
    lines.push(chalk.bold(chalk.cyan(`Assessment for "${this.appName}" (env: ${this.envName})`)));

    lines.push('');
    lines.push(chalk.bold('Resources'));
    lines.push('');
    lines.push(this.renderResourceTable(step));

    lines.push('');
    lines.push(chalk.bold('Features'));
    lines.push('');
    lines.push(this.renderFeatureTable(step));

    return lines.join('\n');
  }

  private renderResourceTable(step: GEN2_MIGRATION_STEP): string {
    let table = undefined;

    switch (step) {
      case 'generate':
      case 'refactor': {
        table = new CLITable({
          head: ['Category', 'Resource', 'Service', 'Support'],
          style: { head: [] },
        });

        for (const a of this._resources) {
          table.push([a.resource.category, a.resource.resourceName, a.resource.service, Assessment.status(a, step)]);
        }
        break;
      }
      case 'all': {
        table = new CLITable({
          head: ['Category', 'Resource', 'Service', 'Generate', 'Refactor'],
          style: { head: [] },
        });

        for (const ra of this._resources) {
          table.push([
            ra.resource.category,
            ra.resource.resourceName,
            ra.resource.service,
            Assessment.status(ra, 'generate'),
            Assessment.status(ra, 'refactor'),
          ]);
        }
        break;
      }
    }
    return table.toString();
  }

  private renderFeatureTable(step: GEN2_MIGRATION_STEP): string {
    let table = undefined;

    switch (step) {
      case 'generate':
      case 'refactor': {
        table = new CLITable({
          head: ['Name', 'Path', 'Support'],
          style: { head: [] },
        });

        for (const fr of this._features) {
          table.push([fr.feature.name, fr.feature.path, Assessment.status(fr, step)]);
        }
        break;
      }
      case 'all': {
        table = new CLITable({
          head: ['Name', 'Path', 'Generate', 'Refactor'],
          style: { head: [] },
        });

        for (const fr of this._features) {
          table.push([fr.feature.name, fr.feature.path, Assessment.status(fr, 'generate'), Assessment.status(fr, 'refactor')]);
        }
        break;
      }
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
