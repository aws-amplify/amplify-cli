import { Assessor } from '../assessor';
import { Assessment } from '../../_assessment';
import { Gen1App, DiscoveredResource } from '../../generate/_infra/gen1-app';

/**
 * Assesses migration readiness for a Cognito User Pool Groups resource.
 * Detects overrides.ts usage.
 */
export class AuthUserPoolGroupsAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level and feature-level support for this user pool groups resource.
   */
  public assess(assessment: Assessment): void {
    assessment.record('generate', this.resource, 'supported');
    assessment.record('refactor', this.resource, 'supported');

    const overridesPath = `auth/${this.resource.resourceName}/override.ts`;

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
