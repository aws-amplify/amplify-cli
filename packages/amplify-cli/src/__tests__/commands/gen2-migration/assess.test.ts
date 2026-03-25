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
  describe('assessFeatures()', () => {
    it('returns empty array when no features detected', () => {
      const gen1App = mockGen1App([]);
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

      expect(assessor.assessFeatures(resource)).toHaveLength(0);
    });

    it('detects custom-policies.json for function resources', () => {
      const gen1App = mockGen1App([], ['function/myFunc/custom-policies.json'], {
        'function/myFunc/custom-policies.json': [{ Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::my-bucket/*'] }],
      });
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' };

      const features = assessor.assessFeatures(resource);

      expect(features).toHaveLength(1);
      expect(features[0].feature.name).toBe('Custom policies');
    });

    it('detects override.ts for auth resources', () => {
      const gen1App = mockGen1App([], ['auth/myPool/override.ts']);
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' };

      const features = assessor.assessFeatures(resource);

      expect(features).toHaveLength(1);
      expect(features[0].feature.name).toBe('Overrides');
    });

    it('ignores empty custom-policies.json', () => {
      const gen1App = mockGen1App([], ['function/myFunc/custom-policies.json'], {
        'function/myFunc/custom-policies.json': [{ Action: [], Resource: [] }],
      });
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' };

      expect(assessor.assessFeatures(resource)).toHaveLength(0);
    });

    it('returns empty for unsupported resources', () => {
      const gen1App = mockGen1App([]);
      const assessor = new AmplifyMigrationAssessor(gen1App);
      const resource: DiscoveredResource = { category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'unsupported' };

      expect(assessor.assessFeatures(resource)).toHaveLength(0);
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
