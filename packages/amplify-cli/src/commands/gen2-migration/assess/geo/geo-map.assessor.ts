import { Assessor } from '../assessor';
import { Assessment, notApplicable, supported } from '../assessment';
import { Gen1App, DiscoveredResource } from '../../_common/gen1-app';

/**
 * Assesses migration readiness for a geo Map resource.
 */
export class GeoMapAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level support for this Map resource.
   */
  public record(assessment: Assessment): void {
    assessment.recordResource({ resource: this.resource, generate: supported(), refactor: notApplicable() });
  }
}
