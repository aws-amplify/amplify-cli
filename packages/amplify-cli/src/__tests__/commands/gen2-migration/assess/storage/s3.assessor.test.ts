import { S3Assessor } from '../../../../../commands/gen2-migration/assess/storage/s3.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/assess/assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/_common/gen1-app';

function mockGen1App(existingFiles: string[] = [], meta: Gen1App['categoryMeta'] = () => undefined): Gen1App {
  const fileSet = new Set(existingFiles);
  return { fileExists: (path: string) => fileSet.has(path), ensureCliInputs: () => undefined, categoryMeta: meta } as unknown as Gen1App;
}

const RESOURCE: DiscoveredResource = { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' };

describe('S3Assessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new S3Assessor(mockGen1App(), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('supported');
    expect(entry!.refactor.level).toBe('supported');
  });

  it('records imported resource as unsupported and skips feature detection', () => {
    const assessment = new Assessment('app', 'dev');
    const meta = (category: string) => (category === 'storage' ? { myBucket: { service: 'S3', serviceType: 'imported' } } : undefined);
    new S3Assessor(mockGen1App(['storage/myBucket/override.ts'], meta as Gen1App['categoryMeta']), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('unsupported');
    expect(entry!.refactor.level).toBe('unsupported');
    expect(assessment.features).toHaveLength(0);
  });

  it('detects override.ts', () => {
    const assessment = new Assessment('app', 'dev');
    new S3Assessor(mockGen1App(['storage/myBucket/override.ts']), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: { name: 'overrides', path: 'storage/myBucket/override.ts' },
      generate: { level: 'unsupported', note: expect.any(String) },
      refactor: { level: 'not-applicable' },
    });
  });

  it('records no features when override.ts is absent', () => {
    const assessment = new Assessment('app', 'dev');
    new S3Assessor(mockGen1App(), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
