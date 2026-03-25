import { S3Assessor } from '../../../../../commands/gen2-migration/assess/storage/s3.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/_assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';

function mockGen1App(existingFiles: string[] = []): Gen1App {
  const fileSet = new Set(existingFiles);
  return { fileExists: (path: string) => fileSet.has(path) } as unknown as Gen1App;
}

const RESOURCE: DiscoveredResource = { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' };

describe('S3Assessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new S3Assessor(mockGen1App(), RESOURCE).assess(assessment);

    const entry = assessment.entries.get('storage:myBucket');
    expect(entry!.generate).toBe('supported');
    expect(entry!.refactor).toBe('supported');
  });

  it('detects override.ts', () => {
    const assessment = new Assessment('app', 'dev');
    new S3Assessor(mockGen1App(['storage/myBucket/override.ts']), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: 'Overrides',
      path: 'storage/myBucket/override.ts',
      generate: 'unsupported',
      refactor: 'not-applicable',
    });
  });

  it('records no features when override.ts is absent', () => {
    const assessment = new Assessment('app', 'dev');
    new S3Assessor(mockGen1App(), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
