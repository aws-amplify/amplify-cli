import 'aws-sdk-client-mock-jest';
import { AmplifyMigrationGenerateStep } from '../../../commands/gen2-migration/generate';
import { MigrationAppOptions, MigrationApp } from './_framework/app';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_common/validations';

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

test('fitness-tracker snapshot', async () => {
  await testSnapshot('fitness-tracker');
});

test('product-catalog snapshot', async () => {
  await testSnapshot('product-catalog');
});

test('project-boards snapshot', async () => {
  await testSnapshot('project-boards');
});

test('backend-only snapshot', async () => {
  await testSnapshot('backend-only');
});

test('discussions snapshot', async () => {
  await testSnapshot('discussions');
});

test('media-vault snapshot', async () => {
  await testSnapshot('media-vault');
});

test('mood-board snapshot', async () => {
  await testSnapshot('mood-board');
});

test('finance-tracker snapshot', async () => {
  await testSnapshot('finance-tracker');
});

test('store-locator snapshot', async () => {
  await testSnapshot('store-locator');
});

test('imported-resources snapshot', async () => {
  await testSnapshot('imported-resources');
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
      const isUpdatingSnapshots = process.env.UPDATE_SNAPSHOTS === '1' || expect.getState().snapshotState._updateSnapshot === 'all';

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

import { Gen1App, DiscoveredResource } from '../../../commands/gen2-migration/_common/gen1-app';
import { SpinningLogger } from '../../../commands/gen2-migration/_common/spinning-logger';
import { DEFAULT_STATEFUL_RESOURCES } from '../../../commands/gen2-migration/_common/resource-types';

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
    statefulResourceTypes: [...Array.from(DEFAULT_STATEFUL_RESOURCES)],
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

    it('skips unsupported resources without instantiating generators', async () => {
      const gen1 = mockGen1App({
        discover: () => [{ category: 'function', resourceName: 'myPythonFunc', service: 'Lambda', key: 'function:Lambda' as const }],
        json: (p: string) => {
          if (p.endsWith('-cloudformation-template.json')) {
            return { Resources: { LambdaFunction: { Properties: { Runtime: 'python3.11' } } } };
          }
          return undefined;
        },
      });
      const logger = new SpinningLogger('generate', { debug: true });

      const plan = await new AmplifyMigrationGenerateStep(logger, gen1, {} as $TSContext, {} as AmplifyGen2MigrationValidations).forward();

      // 3 validation ops (lock, working dir, assessment)
      // 6 infrastructure generators (backend, root package.json, backend package.json, tsconfig, amplify.yml, gitignore)
      // 1 post-generation op (replace folder)
      // = 10 total — the unsupported function contributes zero operations.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accessing private field to assert operation count
      expect((plan as any).operations).toHaveLength(10);
    });
  });
});
