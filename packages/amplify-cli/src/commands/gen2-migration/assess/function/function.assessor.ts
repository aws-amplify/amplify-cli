import { Assessor } from '../assessor';
import { Assessment } from '../../_assessment';
import { Gen1App, DiscoveredResource } from '../../generate/_infra/gen1-app';

/**
 * Assesses migration readiness for a single Lambda function resource.
 * Detects custom-policies.json usage.
 */
export class FunctionAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level and feature-level support for this function.
   */
  public assess(assessment: Assessment): void {
    assessment.record('generate', this.resource, 'supported');
    assessment.record('refactor', this.resource, 'not-applicable');

    const customPoliciesPath = `function/${this.resource.resourceName}/custom-policies.json`;

    if (this.hasCustomPolicies(customPoliciesPath)) {
      assessment.recordFeature({
        feature: 'Custom policies',
        path: customPoliciesPath,
        generate: 'unsupported',
        refactor: 'not-applicable',
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
