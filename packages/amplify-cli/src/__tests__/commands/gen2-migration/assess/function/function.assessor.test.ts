import { FunctionAssessor } from '../../../../../commands/gen2-migration/assess/function/function.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/_assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';

function mockGen1App(existingFiles: string[] = [], jsonFiles: Record<string, unknown> = {}): Gen1App {
  const fileSet = new Set(existingFiles);
  return {
    fileExists: (path: string) => fileSet.has(path),
    json: (path: string) => jsonFiles[path],
  } as unknown as Gen1App;
}

const RESOURCE: DiscoveredResource = { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' };

describe('FunctionAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(mockGen1App(), RESOURCE).assess(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate).toBe('supported');
    expect(entry!.refactor).toBe('not-applicable');
  });

  it('detects non-empty custom-policies.json', () => {
    const gen1App = mockGen1App(['function/myFunc/custom-policies.json'], {
      'function/myFunc/custom-policies.json': [{ Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::bucket/*'] }],
    });
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(gen1App, RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: { name: 'Custom policies', path: 'function/myFunc/custom-policies.json' },
      generate: 'unsupported',
      refactor: 'not-applicable',
    });
  });

  it('ignores empty custom-policies.json', () => {
    const gen1App = mockGen1App(['function/myFunc/custom-policies.json'], {
      'function/myFunc/custom-policies.json': [{ Action: [], Resource: [] }],
    });
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(gen1App, RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });

  it('records no features when custom-policies.json is absent', () => {
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(mockGen1App(), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
