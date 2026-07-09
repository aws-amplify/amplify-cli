import { FunctionAssessor } from '../../../../../commands/gen2-migration/assess/function/function.assessor';
import { Assessment } from '../../../../../commands/gen2-migration/assess/assessment';
import { Gen1App, DiscoveredResource } from '../../../../../commands/gen2-migration/_common/gen1-app';

function mockGen1App(existingFiles: string[] = [], jsonFiles: Record<string, unknown> = {}): Gen1App {
  const fileSet = new Set(existingFiles);
  return {
    fileExists: (path: string) => fileSet.has(path),
    json: (path: string) => jsonFiles[path],
  } as unknown as Gen1App;
}

const NODEJS_TEMPLATE_PATH = 'function/myFunc/myFunc-cloudformation-template.json';
const NODEJS_TEMPLATE = {
  Resources: { LambdaFunction: { Properties: { Runtime: 'nodejs18.x' } } },
};

const RESOURCE: DiscoveredResource = { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' };

describe('FunctionAssessor', () => {
  it('records resource as supported', () => {
    const gen1App = mockGen1App([], { [NODEJS_TEMPLATE_PATH]: NODEJS_TEMPLATE });
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(gen1App, RESOURCE).record(assessment);

    const entry = assessment.resources[0];
    expect(entry!.generate.level).toBe('supported');
    expect(entry!.refactor.level).toBe('not-applicable');
  });

  it('detects non-empty custom-policies.json', () => {
    const gen1App = mockGen1App(['function/myFunc/custom-policies.json'], {
      [NODEJS_TEMPLATE_PATH]: NODEJS_TEMPLATE,
      'function/myFunc/custom-policies.json': [{ Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::bucket/*'] }],
    });
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(gen1App, RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]).toEqual({
      feature: { name: 'custom-policies', path: 'function/myFunc/custom-policies.json' },
      generate: { level: 'unsupported', note: expect.any(String) },
      refactor: { level: 'not-applicable' },
    });
  });

  it('ignores empty custom-policies.json', () => {
    const gen1App = mockGen1App(['function/myFunc/custom-policies.json'], {
      [NODEJS_TEMPLATE_PATH]: NODEJS_TEMPLATE,
      'function/myFunc/custom-policies.json': [{ Action: [], Resource: [] }],
    });
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(gen1App, RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });

  it('detects direct IAM policy object in custom-policies.json', () => {
    const gen1App = mockGen1App(['function/myFunc/custom-policies.json'], {
      [NODEJS_TEMPLATE_PATH]: NODEJS_TEMPLATE,
      'function/myFunc/custom-policies.json': {
        Version: '2012-10-17',
        Statement: [{ Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::bucket/*' }],
      },
    });
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(gen1App, RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(1);
    expect(assessment.features[0]!.generate.level).toBe('unsupported');
  });

  it('records no features when custom-policies.json is absent', () => {
    const gen1App = mockGen1App([], { [NODEJS_TEMPLATE_PATH]: NODEJS_TEMPLATE });
    const assessment = new Assessment('app', 'dev');
    new FunctionAssessor(gen1App, RESOURCE).record(assessment);

    expect(assessment.features).toHaveLength(0);
  });

  describe('non-JS runtime detection', () => {
    it('marks resource as unsupported for generate when runtime is Python', () => {
      const gen1App = mockGen1App([], {
        [NODEJS_TEMPLATE_PATH]: { Resources: { LambdaFunction: { Properties: { Runtime: 'python3.11' } } } },
      });
      const assessment = new Assessment('app', 'dev');
      new FunctionAssessor(gen1App, RESOURCE).record(assessment);

      const entry = assessment.resources[0];
      expect(entry!.generate.level).toBe('unsupported');
      expect(entry!.generate.note).toContain('requires adding code after generate');
      expect(entry!.refactor.level).toBe('not-applicable');
    });

    it('fails assessment validFor generate when runtime is non-JS', () => {
      const gen1App = mockGen1App([], {
        [NODEJS_TEMPLATE_PATH]: { Resources: { LambdaFunction: { Properties: { Runtime: 'dotnet8' } } } },
      });
      const assessment = new Assessment('app', 'dev');
      new FunctionAssessor(gen1App, RESOURCE).record(assessment);

      expect(assessment.validFor('generate')).toBe(false);
      expect(assessment.validFor('refactor')).toBe(true);
    });

    it('treats nodejs runtimes as supported', () => {
      const gen1App = mockGen1App([], { [NODEJS_TEMPLATE_PATH]: NODEJS_TEMPLATE });
      const assessment = new Assessment('app', 'dev');
      new FunctionAssessor(gen1App, RESOURCE).record(assessment);

      expect(assessment.resources[0]!.generate.level).toBe('supported');
      expect(assessment.features).toHaveLength(0);
    });
  });
});
