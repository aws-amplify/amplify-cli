import { AuthUserPoolGroupsAssessor } from '../../../../../commands/gen2-migration/assess/auth/auth-user-pool-groups.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/_assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';

function mockGen1App(existingFiles: string[] = []): Gen1App {
  const fileSet = new Set(existingFiles);
  return { fileExists: (path: string) => fileSet.has(path) } as unknown as Gen1App;
}

const RESOURCE: DiscoveredResource = {
  category: 'auth',
  resourceName: 'userPoolGroups',
  service: 'Cognito-UserPool-Groups',
  key: 'auth:Cognito-UserPool-Groups',
};

describe('AuthUserPoolGroupsAssessor', () => {
  it('records resource as supported', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthUserPoolGroupsAssessor(mockGen1App(), RESOURCE).assess(assessment);

    const entry = assessment.entries.get('auth:userPoolGroups');
    expect(entry!.generate).toBe('supported');
    expect(entry!.refactor).toBe('supported');
  });

  it('detects override.ts', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthUserPoolGroupsAssessor(mockGen1App(['auth/userPoolGroups/override.ts']), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: 'Overrides',
      path: 'auth/userPoolGroups/override.ts',
      generate: 'unsupported',
      refactor: 'not-applicable',
    });
  });

  it('records no features when override.ts is absent', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthUserPoolGroupsAssessor(mockGen1App(), RESOURCE).assess(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
