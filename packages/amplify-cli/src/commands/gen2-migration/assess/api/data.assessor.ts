import { Assessor } from '../assessor';
import { Assessment } from '../../_assessment';
import { Gen1App, DiscoveredResource } from '../../generate/_infra/gen1-app';

/**
 * Assesses migration readiness for an AppSync GraphQL API resource.
 * Detects overrides.ts usage.
 */
export class DataAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level and feature-level support for this API resource.
   */
  public assess(assessment: Assessment): void {
    assessment.record('generate', this.resource, 'supported');
    assessment.record('refactor', this.resource, 'not-applicable');

    const overridesPath = `api/${this.resource.resourceName}/override.ts`;

    if (this.gen1App.fileExists(overridesPath)) {
      assessment.recordFeature({
        feature: 'Overrides',
        path: overridesPath,
        generate: 'unsupported',
        refactor: 'not-applicable',
      });
    }
  }
}
