import { AmplifyMigrationAssessor } from '../../../commands/gen2-migration/assess';
import { Gen1App, DiscoveredResource } from '../../../commands/gen2-migration/_common/gen1-app';
import { SpinningLogger } from '../../../commands/gen2-migration/_common/spinning-logger';

function mockGen1App(resources: DiscoveredResource[], existingFiles: string[] = [], jsonFiles: Record<string, unknown> = {}): Gen1App {
  const fileSet = new Set(existingFiles);
  return {
    appName: 'test-app',
    envName: 'dev',
    discover: () => resources,
    categoryMeta: () => undefined,
    fileExists: (path: string) => fileSet.has(path),
    json: (path: string) => jsonFiles[path],
    ensureCliInputs: () => undefined,
  } as unknown as Gen1App;
}

const NODEJS_TEMPLATE = {
  Resources: { LambdaFunction: { Properties: { Runtime: 'nodejs18.x' } } },
};

describe('AmplifyMigrationAssessor', () => {
  describe('assess()', () => {
    it('returns empty assessment when no resources discovered', () => {
      const gen1App = mockGen1App([]);
      const assessor = new AmplifyMigrationAssessor(gen1App, new SpinningLogger('assess'));
      const assessment = assessor.assess();

      expect(assessment.resources).toHaveLength(0);
      expect(assessment.features).toHaveLength(0);
      expect(assessment.validFor('generate')).toBe(true);
      expect(assessment.validFor('refactor')).toBe(true);
    });

    it('detects custom-policies.json for function resources', () => {
      const gen1App = mockGen1App(
        [{ category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' }],
        ['function/myFunc/custom-policies.json'],
        {
          'function/myFunc/myFunc-cloudformation-template.json': NODEJS_TEMPLATE,
          'function/myFunc/custom-policies.json': [{ Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::my-bucket/*'] }],
        },
      );
      const assessor = new AmplifyMigrationAssessor(gen1App, new SpinningLogger('assess'));
      const assessment = assessor.assess();

      expect(assessment.features).toHaveLength(1);
      expect(assessment.features[0].feature.name).toBe('custom-policies');
    });

    it('detects override.ts for auth resources', () => {
      const gen1App = mockGen1App(
        [{ category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' }],
        ['auth/myPool/override.ts'],
      );
      const assessor = new AmplifyMigrationAssessor(gen1App, new SpinningLogger('assess'));
      const assessment = assessor.assess();

      expect(assessment.features).toHaveLength(1);
      expect(assessment.features[0].feature.name).toBe('overrides');
    });

    it('ignores empty custom-policies.json', () => {
      const gen1App = mockGen1App(
        [{ category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' }],
        ['function/myFunc/custom-policies.json'],
        {
          'function/myFunc/myFunc-cloudformation-template.json': NODEJS_TEMPLATE,
          'function/myFunc/custom-policies.json': [{ Action: [], Resource: [] }],
        },
      );
      const assessor = new AmplifyMigrationAssessor(gen1App, new SpinningLogger('assess'));
      const assessment = assessor.assess();

      expect(assessment.features).toHaveLength(0);
    });

    it('marks UNKNOWN resources as unsupported', () => {
      const gen1App = mockGen1App([{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'UNKNOWN' }]);
      const assessor = new AmplifyMigrationAssessor(gen1App, new SpinningLogger('assess'));
      const assessment = assessor.assess();

      expect(assessment.resources).toHaveLength(1);
      expect(assessment.resources[0].generate.level).toBe('unsupported');
      expect(assessment.resources[0].refactor.level).toBe('unsupported');
    });

    it('marks function with non-JS runtime as unsupported for generate', () => {
      const gen1App = mockGen1App(
        [{ category: 'function', resourceName: 'myPythonFunc', service: 'Lambda', key: 'function:Lambda' }],
        ['function/myPythonFunc/myPythonFunc-cloudformation-template.json'],
        {
          'function/myPythonFunc/myPythonFunc-cloudformation-template.json': {
            Resources: { LambdaFunction: { Properties: { Runtime: 'python3.11' } } },
          },
        },
      );
      const assessor = new AmplifyMigrationAssessor(gen1App, new SpinningLogger('assess'));
      const assessment = assessor.assess();

      expect(assessment.resources).toHaveLength(1);
      expect(assessment.resources[0].generate.level).toBe('unsupported');
      expect(assessment.resources[0].refactor.level).toBe('not-applicable');
      expect(assessment.validFor('generate')).toBe(false);
      expect(assessment.validFor('refactor')).toBe(true);
    });
  });

  describe('run()', () => {
    it('discovers all resources and prints the report', () => {
      const gen1App = mockGen1App([
        { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' },
        { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-require-imports -- capturing printer output
      const { printer } = require('@aws-amplify/amplify-prompts');
      const infoSpy = jest.spyOn(printer, 'info').mockImplementation(() => {});

      new AmplifyMigrationAssessor(gen1App, new SpinningLogger('assess')).run();

      expect(infoSpy).toHaveBeenCalled();

      infoSpy.mockRestore();
    });
  });
});
