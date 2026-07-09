import { Assessor } from '../assessor';
import { Assessment, supported, unsupported, notApplicable } from '../assessment';
import { Gen1App, DiscoveredResource, KNOWN_FEATURES } from '../../_common/gen1-app';

/**
 * Assesses migration readiness for a Cognito User Pool Groups resource.
 * Detects overrides.ts usage.
 */
export class AuthUserPoolGroupsAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level and feature-level support for this user pool groups resource.
   */
  public record(assessment: Assessment): void {
    assessment.recordResource({ resource: this.resource, generate: supported(), refactor: supported() });

    const overridesPath = `auth/${this.resource.resourceName}/override.ts`;

    if (this.gen1App.fileExists(overridesPath)) {
      assessment.recordFeature({
        feature: { name: KNOWN_FEATURES.OVERRIDES, path: overridesPath },
        generate: unsupported('requires adding code after generate'),
        refactor: notApplicable(),
      });
    }
  }
}
