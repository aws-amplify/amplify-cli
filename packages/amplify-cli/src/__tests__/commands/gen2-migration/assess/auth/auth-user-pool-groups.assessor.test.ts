import { AuthUserPoolGroupsAssessor } from '../../../../../commands/gen2-migration/assess/auth/auth-user-pool-groups.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/assess/assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/_common/gen1-app';

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
    new AuthUserPoolGroupsAssessor(mockGen1App(), RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('supported');
    expect(entry!.refactor.level).toBe('supported');
  });

  it('detects override.ts', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthUserPoolGroupsAssessor(mockGen1App(['auth/userPoolGroups/override.ts']), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: { name: 'overrides', path: 'auth/userPoolGroups/override.ts' },
      generate: { level: 'unsupported', note: expect.any(String) },
      refactor: { level: 'not-applicable' },
    });
  });

  it('records no features when override.ts is absent', () => {
    const assessment = new Assessment('app', 'dev');
    new AuthUserPoolGroupsAssessor(mockGen1App(), RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });
});
