import { Assessor } from '../assessor';
import { Assessment, supported, unsupported } from '../assessment';
import { Gen1App, DiscoveredResource } from '../../_common/gen1-app';

/**
 * Assesses migration readiness for a geo GeofenceCollection resource.
 */
export class GeoFenceCollectionAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level support for this GeofenceCollection resource.
   */
  public record(assessment: Assessment): void {
    assessment.recordResource({
      resource: this.resource,
      generate: supported(),
      refactor: unsupported('requires manual data replication'),
    });
  }
}
