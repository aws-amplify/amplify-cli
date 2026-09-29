import { DynamoDBAssessor } from '../../../../../commands/gen2-migration/assess/storage/dynamodb.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/assess/assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/_common/gen1-app';

function mockGen1App(meta: Gen1App['categoryMeta'] = () => undefined): Gen1App {
  return { fileExists: () => false, ensureCliInputs: () => undefined, categoryMeta: meta } as unknown as Gen1App;
}

const RESOURCE: DiscoveredResource = { category: 'storage', resourceName: 'myTable', service: 'DynamoDB', key: 'storage:DynamoDB' };

describe('DynamoDBAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new DynamoDBAssessor(mockGen1App(), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('supported');
    expect(entry!.refactor.level).toBe('supported');
  });

  it('records no features', () => {
    const assessment = new Assessment('app', 'dev');
    new DynamoDBAssessor(mockGen1App(), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });

  it('records imported resource as unsupported', () => {
    const assessment = new Assessment('app', 'dev');
    const meta = (category: string) => (category === 'storage' ? { myTable: { service: 'DynamoDB', serviceType: 'imported' } } : undefined);
    new DynamoDBAssessor(mockGen1App(meta as Gen1App['categoryMeta']), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('unsupported');
    expect(entry!.refactor.level).toBe('unsupported');
  });
});
