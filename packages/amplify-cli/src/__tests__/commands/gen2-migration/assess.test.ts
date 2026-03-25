import { AmplifyMigrationAssessor } from '../../../commands/gen2-migration/assess';
import { Gen1App, DiscoveredResource } from '../../../commands/gen2-migration/generate/_infra/gen1-app';

function mockGen1App(resources: DiscoveredResource[], existingFiles: string[] = [], jsonFiles: Record<string, unknown> = {}): Gen1App {
  const fileSet = new Set(existingFiles);
  return {
    discover: () => resources,
    meta: () => undefined,
    fileExists: (path: string) => fileSet.has(path),
    json: (path: string) => jsonFiles[path],
  } as unknown as Gen1App;
}

describe('AmplifyMigrationAssessor', () => {
  describe('assess()', () => {
    it('records supported resources', () => {
      const gen1App = mockGen1App([]);
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

      const result = assessor.assess(resource, 'app', 'dev');

      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].generate).toBe('supported');
      expect(result.resources[0].refactor).toBe('supported');
    });

    it('records unsupported resources', () => {
      const gen1App = mockGen1App([]);
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'unsupported' };

      const result = assessor.assess(resource, 'app', 'dev');

      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].generate).toBe('unsupported');
      expect(result.resources[0].refactor).toBe('unsupported');
    });

    it('detects custom-policies.json for function resources', () => {
      const gen1App = mockGen1App([], ['function/myFunc/custom-policies.json'], {
        'function/myFunc/custom-policies.json': [{ Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::my-bucket/*'] }],
      });
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' };

      const result = assessor.assess(resource, 'app', 'dev');

      expect(result.features).toHaveLength(1);
      expect(result.features[0].feature.name).toBe('Custom policies');
    });

    it('detects override.ts for auth resources', () => {
      const gen1App = mockGen1App([], ['auth/myPool/override.ts']);
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

      const result = assessor.assess(resource, 'app', 'dev');

      expect(result.features).toHaveLength(1);
      expect(result.features[0].feature.name).toBe('Overrides');
    });

    it('ignores empty custom-policies.json', () => {
      const gen1App = mockGen1App([], ['function/myFunc/custom-policies.json'], {
        'function/myFunc/custom-policies.json': [{ Action: [], Resource: [] }],
      });
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' };

      const result = assessor.assess(resource, 'app', 'dev');

      expect(result.features).toHaveLength(0);
    });

    it('records no features when feature files are absent', () => {
      const gen1App = mockGen1App([]);
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' };

      const result = assessor.assess(resource, 'app', 'dev');

      expect(result.features).toHaveLength(0);
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

      new AmplifyMigrationAssessor(gen1App).run('test-app', 'dev');

      expect(infoSpy).toHaveBeenCalled();

      infoSpy.mockRestore();
    });
  });
});
