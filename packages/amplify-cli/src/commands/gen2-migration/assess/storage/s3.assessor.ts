import { Assessor } from '../assessor';
import { Assessment, supported, unsupported, notApplicable } from '../assessment';
import { Gen1App, DiscoveredResource, KNOWN_FEATURES } from '../../generate/_infra/gen1-app';

/**
 * Assesses migration readiness for an S3 storage resource.
 * Detects overrides.ts usage.
 */
export class S3Assessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level and feature-level support for this S3 resource.
   */
  public record(assessment: Assessment): void {
    assessment.recordResource({ resource: this.resource, generate: supported(), refactor: supported() });

    const overridesPath = `storage/${this.resource.resourceName}/override.ts`;

    if (this.gen1App.fileExists(overridesPath)) {
      assessment.recordFeature({
        feature: { name: KNOWN_FEATURES.OVERRIDES, path: overridesPath },
        generate: unsupported('requires manual code changes'),
        refactor: notApplicable(),
      });
    }
  }
}
