import { AnalyticsKinesisAssessor } from '../../../../../commands/gen2-migration/assess/analytics/kinesis.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/_assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';

const RESOURCE: DiscoveredResource = { category: 'analytics', resourceName: 'myStream', service: 'Kinesis', key: 'analytics:Kinesis' };

describe('AnalyticsKinesisAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new AnalyticsKinesisAssessor({} as Gen1App, RESOURCE).assess(assessment);

    const entry = assessment.entries.get('analytics:myStream');
    expect(entry!.generate).toBe('supported');
    expect(entry!.refactor).toBe('supported');
  });

  it('records no features', () => {
    const assessment = new Assessment('app', 'dev');
    new AnalyticsKinesisAssessor({} as Gen1App, RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
