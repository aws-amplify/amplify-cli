import 'aws-sdk-client-mock-jest';
import { AmplifyMigrationGenerateStep } from '../../../commands/gen2-migration/generate';
import { MigrationAppOptions, MigrationApp } from './_framework/app';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_infra/validations';

// high to allow for debugging in the IDE
const TIMEOUT_MINUTES = 60;

jest.setTimeout(60 * 1000 * TIMEOUT_MINUTES);

// fs-extra is (for some reason) globally mocked in tests via the __mocks__ directory.
// unmock it because we actually need the proper implementation.
// note that this must be declared in the top level since jest will hoist it such that it
// executes prior to any module loading.
jest.unmock('fs-extra');

// no beforeEach needed — DependenciesInstaller was removed.

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

test('store-locator snapshot', async () => {
  await testSnapshot('store-locator', { buildSpec: BUILDSPEC });
});

test('imported-resources snapshot', async () => {
  await testSnapshot('imported-resources', { buildSpec: BUILDSPEC });
});

async function testSnapshot(appName: string, appOptions?: MigrationAppOptions, customize?: (app: MigrationApp) => Promise<void>) {
  await MigrationApp.run(
    appName,
    async (app: MigrationApp) => {
      if (customize) {
        await customize(app);
      }
      const gen1App = app.createGen1App();
      const step = new AmplifyMigrationGenerateStep(app.logger, gen1App, {} as $TSContext, {} as AmplifyGen2MigrationValidations);
      const plan = await step.forward();
      await plan.execute();

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

import { Gen1App, DiscoveredResource } from '../../../commands/gen2-migration/generate/_infra/gen1-app';
import { SpinningLogger } from '../../../commands/gen2-migration/_infra/spinning-logger';

/** Creates a minimal mock Gen1App for unit tests. */
function mockGen1App(overrides: Partial<Gen1App> = {}): Gen1App {
  return {
    appId: 'app-123',
    appName: 'test-app',
    region: 'us-east-1',
    envName: 'dev',
    rootStackName: 'root-stack',
    discover: () => [],
    meta: () => undefined,
    fileExists: () => false,
    ...overrides,
  } as unknown as Gen1App;
}

function mockDiscover(resources: DiscoveredResource[]): Gen1App {
  return mockGen1App({ discover: () => resources });
}

describe('AmplifyMigrationGenerateStep', () => {
  describe('forward()', () => {
    it('fails validation when assessment contains unsupported resources', async () => {
      const gen1 = mockDiscover([{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'UNKNOWN' }]);
      const logger = new SpinningLogger('generate', { debug: true });
      const step = new AmplifyMigrationGenerateStep(logger, gen1, {} as $TSContext, {} as AmplifyGen2MigrationValidations);

      const plan = await step.forward();
      const passed = await plan.validate();
      expect(passed).toBe(false);
    });

    it('passes validation when all resources are supported', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mocking private methods for unit tests
      const lockSpy = jest.spyOn(AmplifyMigrationGenerateStep.prototype as any, 'validateLockStatus').mockResolvedValue({ valid: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mocking private methods for unit tests
      const wdSpy = jest
        .spyOn(AmplifyMigrationGenerateStep.prototype as any, 'validateWorkingDirectory')
        .mockResolvedValue({ valid: true });
      const gen1 = mockDiscover([
        { category: 'auth', resourceName: 'userPoolGroups', service: 'Cognito-UserPool-Groups', key: 'auth:Cognito-UserPool-Groups' },
      ]);
      const logger = new SpinningLogger('generate', { debug: true });
      const step = new AmplifyMigrationGenerateStep(logger, gen1, {} as $TSContext, {} as AmplifyGen2MigrationValidations);

      const plan = await step.forward();
      const passed = await plan.validate();
      expect(passed).toBe(true);
      lockSpy.mockRestore();
      wdSpy.mockRestore();
    });
  });
});
