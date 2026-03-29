import { DynamoDBAssessor } from '../../../../../commands/gen2-migration/assess/storage/dynamodb.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/_assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';

const RESOURCE: DiscoveredResource = { category: 'storage', resourceName: 'myTable', service: 'DynamoDB', key: 'storage:DynamoDB' };

describe('DynamoDBAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new DynamoDBAssessor({ fileExists: () => false } as unknown as Gen1App, RESOURCE).assess(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate).toBe('supported');
    expect(entry!.refactor).toBe('supported');
  });

  it('records no features', () => {
    const assessment = new Assessment('app', 'dev');
    new DynamoDBAssessor({ fileExists: () => false } as unknown as Gen1App, RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
