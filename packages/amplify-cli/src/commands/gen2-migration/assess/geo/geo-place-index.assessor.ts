import { Assessor } from '../assessor';
import { Assessment, notApplicable, supported } from '../assessment';
import { Gen1App, DiscoveredResource } from '../../_common/gen1-app';

/**
 * Assesses migration readiness for a geo PlaceIndex resource.
 */
export class GeoPlaceIndexAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level support for this PlaceIndex resource.
   */
  public record(assessment: Assessment): void {
    assessment.recordResource({ resource: this.resource, generate: supported(), refactor: notApplicable() });
  }
}
