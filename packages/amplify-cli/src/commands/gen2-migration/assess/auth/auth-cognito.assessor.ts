import { Assessor } from '../assessor';
import { Assessment } from '../../_assessment';
import { Gen1App, DiscoveredResource, KNOWN_FEATURES } from '../../generate/_infra/gen1-app';

/**
 * Assesses migration readiness for a Cognito auth resource.
 * Detects overrides.ts usage.
 */
export class AuthCognitoAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level and feature-level support for this auth resource.
   */
  public assess(assessment: Assessment): void {
    assessment.recordResource({ resource: this.resource, generate: 'supported', refactor: 'supported' });

    const overridesPath = `auth/${this.resource.resourceName}/override.ts`;

    if (this.gen1App.fileExists(overridesPath)) {
      assessment.recordFeature({
        feature: { name: KNOWN_FEATURES.OVERRIDES, path: overridesPath },
        generate: 'unsupported',
        refactor: 'not-applicable',
      });
    }
  }
}
