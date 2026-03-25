import { Assessor } from '../assessor';
import { Assessment } from '../../_assessment';
import { Gen1App, DiscoveredResource } from '../../generate/_infra/gen1-app';

/**
 * Assesses migration readiness for an API Gateway REST API resource.
 */
export class RestApiAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level support for this REST API resource.
   */
  public assess(assessment: Assessment): void {
    assessment.recordResource({ resource: this.resource, generate: 'supported', refactor: 'not-applicable' });
  }
}
