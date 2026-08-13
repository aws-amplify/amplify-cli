import { Gen1App } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { DEFAULT_STATEFUL_RESOURCES } from '../../../../../commands/gen2-migration/_common/resource-types';
import { AwsClients } from '../../../../../commands/gen2-migration/_common/aws-clients';
import { stateManager, pathManager } from '@aws-amplify/amplify-cli-core';
import fs from 'node:fs/promises';
import { mkdtempSync, writeFileSync } from 'node:fs';
import * as path from 'path';
import * as os from 'os';

// fs-extra is globally mocked in tests via the __mocks__ directory.
// unmock it because we need the real implementation for JSONUtilities.readJson.
jest.unmock('fs-extra');

jest.mock('node:fs/promises');

afterAll(() => {
  jest.resetModules();
  jest.mock('fs-extra');
});

/**
 * Creates a Gen1App with a known _meta for testing discover().
 */
function createGen1AppWithMeta(meta: Record<string, unknown>): Gen1App {
  const app = Object.create(Gen1App.prototype);
  app._meta = meta;
  return app;
}

describe('Gen1App', () => {
  describe('discover()', () => {
    it('returns resources from all categories', () => {
      const app = createGen1AppWithMeta({
        auth: { myPool: { service: 'Cognito' } },
        storage: { myBucket: { service: 'S3' } },
        function: { myFunc: { service: 'Lambda' } },
      });

      const resources = app.discover();

      expect(resources).toEqual([
        { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' },
        { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' },
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
      ]);
    });

    it('skips the providers category', () => {
      const app = createGen1AppWithMeta({
        providers: { awscloudformation: { service: 'CloudFormation' } },
        auth: { myPool: { service: 'Cognito' } },
      });

      const resources = app.discover();

      expect(resources).toEqual([{ category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' }]);
    });

    it('skips the hosting category', () => {
      const app = createGen1AppWithMeta({
        hosting: { amplifyhosting: { service: 'amplifyhosting' } },
        auth: { myPool: { service: 'Cognito' } },
      });

      const resources = app.discover();

      expect(resources).toEqual([{ category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' }]);
    });

    it('throws when a resource is missing the service field', () => {
      const app = createGen1AppWithMeta({
        auth: {
          myPool: { service: 'Cognito' },
          noService: { providerPlugin: 'awscloudformation' },
        },
      });

      expect(() => app.discover()).toThrow("Resource 'noService' in category 'auth' is missing the 'service' field");
    });

    it('skips non-object category values', () => {
      const app = createGen1AppWithMeta({
        auth: { myPool: { service: 'Cognito' } },
        someString: 'not an object',
      });

      const resources = app.discover();

      expect(resources).toEqual([{ category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' }]);
    });

    it('returns empty array for empty meta', () => {
      const app = createGen1AppWithMeta({});

      expect(app.discover()).toEqual([]);
    });

    it('handles multiple resources in the same category', () => {
      const app = createGen1AppWithMeta({
        storage: {
          myBucket: { service: 'S3' },
          myTable: { service: 'DynamoDB' },
        },
      });

      const resources = app.discover();

      expect(resources).toEqual([
        { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' },
        { category: 'storage', resourceName: 'myTable', service: 'DynamoDB', key: 'storage:DynamoDB' },
      ]);
    });
  });

  describe('ensureCliInputs()', () => {
    it('throws AmplifyError with resolution when cli-inputs.json is missing', () => {
      const app = createGen1AppWithMeta({});
      // Set ccbDir to a path that won't contain the file.
      (app as any).ccbDir = '/nonexistent/path';

      try {
        app.ensureCliInputs('storage', 'myResource');
        fail('Expected ensureCliInputs to throw');
      } catch (e: any) {
        expect(e.name).toBe('CliInputsFileNotFoundError');
        expect(e.message).toContain('Unable to find');
        expect(e.message).toContain('cli-inputs.json');
        expect(e.resolution).toContain('latest Gen1 CLI version');
      }
    });
  });

  describe('create() - additionalStatefulResourceTypes validation', () => {
    beforeEach(() => {
      jest.spyOn(stateManager, 'teamProviderInfoExists').mockReturnValue(true);
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        main: { awscloudformation: { AmplifyAppId: 'app-id', StackName: 'stack', DeploymentBucketName: 'bucket' } },
      });
      jest.spyOn(pathManager, 'getTeamProviderInfoFilePath').mockReturnValue('/tmp/tpi.json');
      jest.spyOn(AwsClients, 'create').mockResolvedValue({
        amplify: { send: jest.fn().mockResolvedValue({ app: { appId: 'app-id', name: 'test-app' } }) },
        s3: {},
      } as unknown as AwsClients);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(Gen1App as any, 'currentEnvName').mockResolvedValue('main');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('throws InputValidationError when file contains a JSON object instead of array', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({ key: 'value' }));

      await expect(Gen1App.create({} as any, 'test', '/path/to/stateful-types.json')).rejects.toMatchObject({
        name: 'InputValidationError',
        message: 'Invalid file structure: /path/to/stateful-types.json. Must be a JSON array.',
      });
    });

    it('throws InputValidationError when file contains a JSON string instead of array', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify('just a string'));

      await expect(Gen1App.create({} as any, 'test', '/path/to/stateful-types.json')).rejects.toMatchObject({
        name: 'InputValidationError',
        message: 'Invalid file structure: /path/to/stateful-types.json. Must be a JSON array.',
      });
    });

    it('throws InputValidationError when file contains a number instead of array', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(42));

      await expect(Gen1App.create({} as any, 'test', '/path/to/stateful-types.json')).rejects.toMatchObject({
        name: 'InputValidationError',
        message: 'Invalid file structure: /path/to/stateful-types.json. Must be a JSON array.',
      });
    });

    it('does not throw when file contains a valid JSON array', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(['AWS::Custom::MyResource']));

      const ccbDir = mkdtempSync(path.join(os.tmpdir(), 'gen1app-test-'));
      writeFileSync(
        path.join(ccbDir, 'amplify-meta.json'),
        JSON.stringify({ providers: { awscloudformation: { StackName: 'stack', Region: 'us-east-1' } } }),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(Gen1App as any, 'downloadCloudBackend').mockResolvedValue(ccbDir);

      const app = await Gen1App.create({} as any, 'test', '/path/to/stateful-types.json');

      expect(app.statefulResourceTypes).toEqual([...DEFAULT_STATEFUL_RESOURCES, 'AWS::Custom::MyResource']);
    });
  });
});
