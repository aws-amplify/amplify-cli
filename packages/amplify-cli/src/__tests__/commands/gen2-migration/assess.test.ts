import { AmplifyMigrationAssessor } from '../../../commands/gen2-migration/assess';
import { Gen1App, DiscoveredResource } from '../../../commands/gen2-migration/generate-new/_infra/gen1-app';
import { Assessment } from '../../../commands/gen2-migration/_assessment';
import { Logger } from '../../../commands/gen2-migration';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

jest.mock('../../../commands/gen2-migration/generate-new/_infra/gen1-app', () => {
  const actual = jest.requireActual('../../../commands/gen2-migration/generate-new/_infra/gen1-app');
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

function mockDiscover(resources: DiscoveredResource[]): void {
  (Gen1App.create as jest.Mock).mockResolvedValue({
    discover: () => resources,
    meta: () => undefined,
  });
}

function createAssessor(): AmplifyMigrationAssessor {
  const logger = new Logger('assess', 'test-app', 'dev');
  return new AmplifyMigrationAssessor(logger, 'dev', 'test-app', 'app-123', 'root-stack', 'us-east-1', {} as $TSContext);
}

describe('AmplifyMigrationAssessor', () => {
  describe('run()', () => {
    it('records all supported resources as supported for both generate and refactor', async () => {
      mockDiscover([
        { category: 'auth', resourceName: 'myPool', service: 'Cognito' },
        { category: 'storage', resourceName: 'myBucket', service: 'S3' },
        { category: 'function', resourceName: 'myFunc', service: 'Lambda' },
      ]);

      const renderSpy = jest.spyOn(Assessment.prototype, 'render').mockImplementation(() => {});
      const recordSpy = jest.spyOn(Assessment.prototype, 'record');

      await createAssessor().run();

      // Generate records all three as supported
      expect(recordSpy).toHaveBeenCalledWith('generate', expect.objectContaining({ resourceName: 'myPool' }), {
        supported: true,
        notes: [],
      });
      expect(recordSpy).toHaveBeenCalledWith('generate', expect.objectContaining({ resourceName: 'myBucket' }), {
        supported: true,
        notes: [],
      });
      expect(recordSpy).toHaveBeenCalledWith('generate', expect.objectContaining({ resourceName: 'myFunc' }), {
        supported: true,
        notes: [],
      });

      // Refactor records all three as supported
      expect(recordSpy).toHaveBeenCalledWith('refactor', expect.objectContaining({ resourceName: 'myPool' }), {
        supported: true,
        notes: [],
      });
      expect(recordSpy).toHaveBeenCalledWith('refactor', expect.objectContaining({ resourceName: 'myBucket' }), {
        supported: true,
        notes: [],
      });
      expect(recordSpy).toHaveBeenCalledWith('refactor', expect.objectContaining({ resourceName: 'myFunc' }), {
        supported: true,
        notes: [],
      });

      expect(renderSpy).toHaveBeenCalled();

      renderSpy.mockRestore();
      recordSpy.mockRestore();
    });

    it('records unsupported resources as not supported', async () => {
      mockDiscover([
        { category: 'auth', resourceName: 'myPool', service: 'Cognito' },
        { category: 'notifications', resourceName: 'push', service: 'Pinpoint' },
      ]);

      const renderSpy = jest.spyOn(Assessment.prototype, 'render').mockImplementation(() => {});
      const recordSpy = jest.spyOn(Assessment.prototype, 'record');

      await createAssessor().run();

      // Notifications is unsupported for both
      expect(recordSpy).toHaveBeenCalledWith('generate', expect.objectContaining({ resourceName: 'push' }), {
        supported: false,
        notes: [],
      });
      expect(recordSpy).toHaveBeenCalledWith('refactor', expect.objectContaining({ resourceName: 'push' }), {
        supported: false,
        notes: [],
      });

      renderSpy.mockRestore();
      recordSpy.mockRestore();
    });

    it('calls render after recording all resources', async () => {
      mockDiscover([{ category: 'auth', resourceName: 'myPool', service: 'Cognito' }]);

      const renderSpy = jest.spyOn(Assessment.prototype, 'render').mockImplementation(() => {});

      await createAssessor().run();

      expect(renderSpy).toHaveBeenCalledTimes(1);

      renderSpy.mockRestore();
    });
  });
});
