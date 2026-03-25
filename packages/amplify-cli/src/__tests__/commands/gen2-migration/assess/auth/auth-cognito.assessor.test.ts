import { AuthCognitoAssessor } from '../../../../../commands/gen2-migration/assess/auth/auth-cognito.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/_assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';

function mockGen1App(existingFiles: string[] = []): Gen1App {
  const fileSet = new Set(existingFiles);
  return { fileExists: (path: string) => fileSet.has(path) } as unknown as Gen1App;
}

const RESOURCE: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

describe('AuthCognitoAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthCognitoAssessor(mockGen1App(), RESOURCE).assess(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate).toBe('supported');
    expect(entry!.refactor).toBe('supported');
  });

  it('detects override.ts', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthCognitoAssessor(mockGen1App(['auth/myPool/override.ts']), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: 'Overrides',
      path: 'auth/myPool/override.ts',
      generate: 'unsupported',
      refactor: 'not-applicable',
    });
  });

  it('records no features when override.ts is absent', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthCognitoAssessor(mockGen1App(), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
