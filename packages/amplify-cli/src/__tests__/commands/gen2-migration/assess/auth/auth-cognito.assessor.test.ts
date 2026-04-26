import { AuthCognitoAssessor } from '../../../../../commands/gen2-migration/assess/auth/auth-cognito.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/assess/assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/_common/gen1-app';

function mockGen1App(existingFiles: string[] = []): Gen1App {
  const fileSet = new Set(existingFiles);
  return {
    fileExists: (path: string) => fileSet.has(path),
    ensureCliInputs: () => undefined,
    categoryMeta: () => undefined,
  } as unknown as Gen1App;
}

const RESOURCE: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

describe('AuthCognitoAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthCognitoAssessor(mockGen1App(), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('supported');
    expect(entry!.refactor.level).toBe('supported');
  });

  it('detects override.ts', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthCognitoAssessor(mockGen1App(['auth/myPool/override.ts']), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: { name: 'overrides', path: 'auth/myPool/override.ts' },
      generate: { level: 'unsupported', note: expect.any(String) },
      refactor: { level: 'not-applicable' },
    });
  });

  it('records no features when override.ts is absent', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthCognitoAssessor(mockGen1App(), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
