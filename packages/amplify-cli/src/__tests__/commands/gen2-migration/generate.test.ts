import 'aws-sdk-client-mock-jest';
import { AmplifyMigrationGenerateStep, DependenciesInstaller } from '../../../commands/gen2-migration/generate';
import { MigrationAppOptions, MigrationApp } from './_framework/app';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

// high to allow for debugging in the IDE
const TIMEOUT_MINUTES = 60;

jest.setTimeout(60 * 1000 * TIMEOUT_MINUTES);

// fs-extra is (for some reason) globally mocked in tests via the __mocks__ directory.
// unmock it because we actually need the proper implementation.
// note that this must be declared in the top level since jest will hoist it such that it
// executes prior to any module loading.
jest.unmock('fs-extra');

beforeEach(() => {
  // avoid running npm install during tests
  jest.spyOn(DependenciesInstaller, 'install').mockResolvedValue();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

afterAll(() => {
  // this will clear the process 'require' cache so that subsequent code
  // will be forced to reload modules.
  jest.resetModules();

  // this will reapply the mock defined in __mocks__/fs-extra.ts so all subsequent
  // code using require('fs-extra') will grab the mock.
  jest.mock('fs-extra');
});

// standard buildspec for all apps that are published via hosting
const BUILDSPEC =
  "version: 1\nbackend:\n  phases:\n    build:\n      commands:\n        - '# Execute Amplify CLI with the helper script'\n        - amplifyPush --simple\nfrontend:\n  phases:\n    preBuild:\n      commands:\n        - npm install\n    build:\n      commands:\n        - npm run build\n  artifacts:\n    baseDirectory: dist\n    files:\n      - '**/*'\n  cache:\n    paths:\n      - node_modules/**/*\n";

test('fitness-tracker snapshot', async () => {
  await testSnapshot('fitness-tracker', { buildSpec: BUILDSPEC });
});

test('product-catalog snapshot', async () => {
  await testSnapshot('product-catalog', { buildSpec: BUILDSPEC });
});

test('project-boards snapshot', async () => {
  await testSnapshot('project-boards', { buildSpec: BUILDSPEC });
});

test('backend-only snapshot', async () => {
  await testSnapshot('backend-only');
});

test('discussions snapshot', async () => {
  await testSnapshot('discussions', { buildSpec: BUILDSPEC });
});

test('media-vault snapshot', async () => {
  await testSnapshot('media-vault', { buildSpec: BUILDSPEC });
});

test('mood-board snapshot', async () => {
  await testSnapshot('mood-board', { buildSpec: BUILDSPEC });
});

async function testSnapshot(appName: string, appOptions?: MigrationAppOptions, customize?: (app: MigrationApp) => Promise<void>) {
  await MigrationApp.run(
    appName,
    async (app: MigrationApp) => {
      if (customize) {
        await customize(app);
      }
      const step = new AmplifyMigrationGenerateStep(
        app.logger,
        app.environmentName,
        app.name,
        app.id,
        app.rootStackName,
        app.region,
        {} as $TSContext,
      );
      const operations = await step.execute();
      for (const operation of operations) {
        await operation.execute();
      }

      const report = await app.snapshots.generate.compare(process.cwd());
      const isUpdatingSnapshots = expect.getState().snapshotState._updateSnapshot === 'all';

      if (report.hasChanges) {
        report.print();
        if (isUpdatingSnapshots) {
          app.snapshots.generate.update(process.cwd());
        }
      }
      expect(report.hasChanges).toBeFalsy();
    },
    appOptions,
  );
}

import { Gen1App, DiscoveredResource } from '../../../commands/gen2-migration/generate-new/_infra/gen1-app';
import { Assessment } from '../../../commands/gen2-migration/_assessment';
import { Logger } from '../../../commands/gen2-migration';

function mockDiscover(resources: DiscoveredResource[]): jest.SpyInstance {
  return jest.spyOn(Gen1App, 'create').mockResolvedValue({
    discover: () => resources,
    meta: () => undefined,
  } as unknown as Gen1App);
}

function createStep(): AmplifyMigrationGenerateStep {
  const logger = new Logger('generate', 'test-app', 'dev');
  return new AmplifyMigrationGenerateStep(logger, 'dev', 'test-app', 'app-123', 'root-stack', 'us-east-1', {} as $TSContext);
}

describe('AmplifyMigrationGenerateStep', () => {
  let createSpy: jest.SpyInstance;

  afterEach(() => {
    createSpy?.mockRestore();
  });

  describe('assess()', () => {
    it('records supported resources as supported', async () => {
      createSpy = mockDiscover([
        { category: 'auth', resourceName: 'myPool', service: 'Cognito', key: 'auth:Cognito' },
        { category: 'storage', resourceName: 'myBucket', service: 'S3', key: 'storage:S3' },
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
      ]);

      const recordSpy = jest.spyOn(Assessment.prototype, 'record');
      const step = createStep();
      await step.assess(new Assessment('test-app', 'dev'));

      for (const name of ['myPool', 'myBucket', 'myFunc']) {
        expect(recordSpy).toHaveBeenCalledWith('generate', expect.objectContaining({ resourceName: name }), {
          supported: true,
          notes: [],
        });
      }

      recordSpy.mockRestore();
    });

    it('records unsupported key as not supported', async () => {
      createSpy = mockDiscover([{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'unsupported' }]);

      const recordSpy = jest.spyOn(Assessment.prototype, 'record');
      const step = createStep();
      await step.assess(new Assessment('test-app', 'dev'));

      expect(recordSpy).toHaveBeenCalledWith('generate', expect.objectContaining({ resourceName: 'push' }), {
        supported: false,
        notes: [],
      });

      recordSpy.mockRestore();
    });
  });

  describe('execute()', () => {
    it('warns and skips unsupported resources instead of throwing', async () => {
      createSpy = mockDiscover([{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'unsupported' }]);

      const step = createStep();
      // Should not throw — generate warns on unsupported, unlike refactor
      const operations = await step.execute();
      expect(operations.length).toBeGreaterThan(0);
    });
  });
});
