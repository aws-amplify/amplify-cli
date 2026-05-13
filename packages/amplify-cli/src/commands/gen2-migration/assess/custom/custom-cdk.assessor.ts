import { Assessor } from '../assessor';
import { Assessment, supported } from '../assessment';
import { DiscoveredResource } from '../../_common/gen1-app';

/**
 * Assesses migration readiness for a CDK custom resource.
 * Custom resources are stateless — generate is supported, refactor is not applicable.
 */
export class CustomCdkAssessor implements Assessor {
  public constructor(private readonly resource: DiscoveredResource) {}

  /** Records resource-level support for this custom CDK resource. */
  public record(assessment: Assessment): void {
    assessment.recordResource({ resource: this.resource, generate: supported(), refactor: supported() });
  }
}
