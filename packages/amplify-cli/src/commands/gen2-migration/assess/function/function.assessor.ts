import { Assessor } from '../assessor';
import { Assessment, supported, unsupported, notApplicable } from '../assessment';
import { Gen1App, DiscoveredResource, KNOWN_FEATURES } from '../../_common/gen1-app';

/**
 * Assesses migration readiness for a single Lambda function resource.
 * All runtimes (Node.js, Python, Go, Java, .NET) are supported for generation.
 * Detects custom-policies.json usage as an unsupported feature.
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
      refactor: notApplicable(),
    });

    const customPoliciesPath = `function/${this.resource.resourceName}/custom-policies.json`;

    if (this.hasCustomPolicies(customPoliciesPath)) {
      assessment.recordFeature({
        feature: { name: KNOWN_FEATURES.CUSTOM_FUNCTION_POLICIES, path: customPoliciesPath },
        generate: unsupported('requires adding code after generate'),
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

    // default empty structure is array, so if its something else
    // the user must have changed it.
    if (!Array.isArray(policies)) return true;

    return policies.some(
      (p: { Action: string | string[]; Resource: string | string[] }) =>
        (p.Action && p.Action.length > 0) || (p.Resource && p.Resource.length > 0),
    );
  }
}
