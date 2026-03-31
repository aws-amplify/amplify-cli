import { Assessor } from '../assessor';
import { Assessment, supported, unsupported, notApplicable } from '../assessment';
import { Gen1App, DiscoveredResource, KNOWN_FEATURES } from '../../generate/_infra/gen1-app';

/**
 * Assesses migration readiness for a single Lambda function resource.
 * Detects custom-policies.json usage.
 */
export class FunctionAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level and feature-level support for this function.
   */
  public record(assessment: Assessment): void {
    assessment.recordResource({
      resource: this.resource,
      generate: supported(),
      refactor: supported(),
    });

    const customPoliciesPath = `function/${this.resource.resourceName}/custom-policies.json`;

    if (this.hasCustomPolicies(customPoliciesPath)) {
      assessment.recordFeature({
        feature: { name: KNOWN_FEATURES.CUSTOM_FUNCTION_POLICIES, path: customPoliciesPath },
        generate: unsupported('requires manual code changes'),
        refactor: notApplicable(),
      });
    }
  }

  /**
   * Returns true if the function has non-empty custom policies.
   * The file always exists but defaults to `[{"Action":[],"Resource":[]}]`.
   */
  private hasCustomPolicies(filePath: string): boolean {
    if (!this.gen1App.fileExists(filePath)) return false;

    const policies = this.gen1App.json(filePath);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped custom-policies.json
    return policies.some((p: any) => p.Action.length > 0 || p.Resource.length > 0);
  }
}
