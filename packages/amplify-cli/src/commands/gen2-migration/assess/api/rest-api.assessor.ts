import { Assessor } from '../assessor';
import { Assessment } from '../../_assessment';
import { Gen1App, DiscoveredResource, KNOWN_FEATURES } from '../../generate/_infra/gen1-app';

/**
 * Assesses migration readiness for an API Gateway REST API resource.
 */
export class RestApiAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level support for this REST API resource.
   */
  public assess(assessment: Assessment): void {
    assessment.recordResource({ resource: this.resource, generate: 'supported', refactor: 'not-applicable' });

    const overridesPath = `api/${this.resource.resourceName}/override.ts`;

    if (this.gen1App.fileExists(overridesPath)) {
      assessment.recordFeature({
        feature: { name: KNOWN_FEATURES.OVERRIDES, path: overridesPath },
        generate: 'unsupported',
        refactor: 'not-applicable',
      });
    }
  }
}
