import { DataAssessor } from '../../../../../commands/gen2-migration/assess/api/data.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/_assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';

function mockGen1App(existingFiles: string[] = []): Gen1App {
  const fileSet = new Set(existingFiles);
  return { fileExists: (path: string) => fileSet.has(path) } as unknown as Gen1App;
}

const RESOURCE: DiscoveredResource = { category: 'api', resourceName: 'myApi', service: 'AppSync', key: 'api:AppSync' };

describe('DataAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App(), RESOURCE).assess(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate).toBe('supported');
    expect(entry!.refactor).toBe('not-applicable');
  });

  it('detects override.ts', () => {
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App(['api/myApi/override.ts']), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: { name: 'Overrides', path: 'api/myApi/override.ts' },
      generate: 'unsupported',
      refactor: 'not-applicable',
    });
  });

  it('records no features when override.ts is absent', () => {
    const assessment = new Assessment('app', 'dev');
    new DataAssessor(mockGen1App(), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
