import { AmplifyMigrationAssessor } from '../../../commands/gen2-migration/assess';
import { Gen1App, DiscoveredResource } from '../../../commands/gen2-migration/generate/_infra/gen1-app';
import { Assessment } from '../../../commands/gen2-migration/_assessment';
import { SpinningLogger } from '../../../commands/gen2-migration/_spinning-logger';

jest.mock('../../../commands/gen2-migration/generate/_infra/gen1-app', () => {
  const actual = jest.requireActual('../../../commands/gen2-migration/generate/_infra/gen1-app');
  return {
    ...actual,
    Gen1App: {
      ...actual.Gen1App,
      create: jest.fn(),
    },
  };
});

jest.mock('../../../commands/gen2-migration/aws-clients', () => ({
  AwsClients: jest.fn(),
}));

function mockGen1App(resources: DiscoveredResource[], existingFiles: string[] = [], jsonFiles: Record<string, unknown> = {}): void {
  const fileSet = new Set(existingFiles);
  (Gen1App.create as jest.Mock).mockResolvedValue({
    discover: () => resources,
    meta: () => undefined,
    fileExists: (path: string) => fileSet.has(path),
    json: (path: string) => jsonFiles[path],
  });
}

function createAssessor(): AmplifyMigrationAssessor {
  const logger = new SpinningLogger('assess', { debug: true });
  return new AmplifyMigrationAssessor(logger, 'dev', 'test-app', 'app-123', 'us-east-1');
}

describe('AmplifyMigrationAssessor', () => {
  describe('run()', () => {
    it('records supported resources', async () => {
      mockGen1App([
        { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' },
        { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' },
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
      ]);

      const displaySpy = jest.spyOn(Assessment.prototype, 'display').mockImplementation(() => {});
      const recordSpy = jest.spyOn(Assessment.prototype, 'recordResource');

      await createAssessor().run();

      expect(recordSpy).toHaveBeenCalledWith(expect.objectContaining({ resourceName: 'myPool' }), 'supported', 'supported');
      expect(recordSpy).toHaveBeenCalledWith(expect.objectContaining({ resourceName: 'myBucket' }), 'supported', 'supported');
      expect(recordSpy).toHaveBeenCalledWith(expect.objectContaining({ resourceName: 'myFunc' }), 'supported', 'not-applicable');
      expect(displaySpy).toHaveBeenCalled();

      displaySpy.mockRestore();
      recordSpy.mockRestore();
    });

    it('records unsupported resources', async () => {
      mockGen1App([
        { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' },
        { category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'unsupported' },
      ]);

      const displaySpy = jest.spyOn(Assessment.prototype, 'display').mockImplementation(() => {});
      const recordSpy = jest.spyOn(Assessment.prototype, 'recordResource');

      await createAssessor().run();

      expect(recordSpy).toHaveBeenCalledWith(expect.objectContaining({ resourceName: 'push' }), 'unsupported', 'unsupported');

      displaySpy.mockRestore();
      recordSpy.mockRestore();
    });

    it('detects custom-policies.json for function resources', async () => {
      mockGen1App(
        [{ category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' }],
        ['function/myFunc/custom-policies.json'],
        { 'function/myFunc/custom-policies.json': [{ Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::my-bucket/*'] }] },
      );

      const displaySpy = jest.spyOn(Assessment.prototype, 'display').mockImplementation(() => {});
      const featureSpy = jest.spyOn(Assessment.prototype, 'recordFeature');

      await createAssessor().run();

      expect(featureSpy).toHaveBeenCalledWith({
        feature: 'Custom policies',
        path: 'function/myFunc/custom-policies.json',
        generate: 'unsupported',
        refactor: 'not-applicable',
      });

      displaySpy.mockRestore();
      featureSpy.mockRestore();
    });

    it('detects override.ts for auth resources', async () => {
      mockGen1App([{ category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' }], ['auth/myPool/override.ts']);

      const displaySpy = jest.spyOn(Assessment.prototype, 'display').mockImplementation(() => {});
      const featureSpy = jest.spyOn(Assessment.prototype, 'recordFeature');

      await createAssessor().run();

      expect(featureSpy).toHaveBeenCalledWith({
        feature: 'Overrides',
        path: 'auth/myPool/override.ts',
        generate: 'unsupported',
        refactor: 'not-applicable',
      });

      displaySpy.mockRestore();
      featureSpy.mockRestore();
    });

    it('ignores empty custom-policies.json', async () => {
      mockGen1App(
        [{ category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' }],
        ['function/myFunc/custom-policies.json'],
        { 'function/myFunc/custom-policies.json': [{ Action: [], Resource: [] }] },
      );

      const displaySpy = jest.spyOn(Assessment.prototype, 'display').mockImplementation(() => {});
      const featureSpy = jest.spyOn(Assessment.prototype, 'recordFeature');

      await createAssessor().run();

      expect(featureSpy).not.toHaveBeenCalled();

      displaySpy.mockRestore();
      featureSpy.mockRestore();
    });

    it('does not record features when feature files are absent', async () => {
      mockGen1App([
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
        { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' },
      ]);

      const displaySpy = jest.spyOn(Assessment.prototype, 'display').mockImplementation(() => {});
      const featureSpy = jest.spyOn(Assessment.prototype, 'recordFeature');

      await createAssessor().run();

      expect(featureSpy).not.toHaveBeenCalled();

      displaySpy.mockRestore();
      featureSpy.mockRestore();
    });

    it('calls display after recording all resources', async () => {
      mockGen1App([{ category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' }]);

      const displaySpy = jest.spyOn(Assessment.prototype, 'display').mockImplementation(() => {});

      await createAssessor().run();

      expect(displaySpy).toHaveBeenCalledTimes(1);

      displaySpy.mockRestore();
    });
  });
});
