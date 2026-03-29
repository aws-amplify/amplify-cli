import { RestApiAssessor } from '../../../../../commands/gen2-migration/assess/api/rest-api.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/_assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';

const RESOURCE: DiscoveredResource = { category: 'api', resourceName: 'myApi', service: 'API Gateway', key: 'api:API Gateway' };

describe('RestApiAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new RestApiAssessor({ fileExists: () => false } as unknown as Gen1App, RESOURCE).assess(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate).toBe('supported');
    expect(entry!.refactor).toBe('not-applicable');
  });

  it('records no features', () => {
    const assessment = new Assessment('app', 'dev');
    new RestApiAssessor({ fileExists: () => false } as unknown as Gen1App, RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
