import { AnalyticsKinesisAssessor } from '../../../../../commands/gen2-migration/assess/analytics/kinesis.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/assess/assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/_common/gen1-app';

const RESOURCE: DiscoveredResource = { category: 'analytics', resourceName: 'myStream', service: 'Kinesis', key: 'analytics:Kinesis' };

describe('AnalyticsKinesisAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new AnalyticsKinesisAssessor({} as Gen1App, RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('supported');
    expect(entry!.refactor.level).toBe('supported');
  });

  it('records no features', () => {
    const assessment = new Assessment('app', 'dev');
    new AnalyticsKinesisAssessor({} as Gen1App, RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
