import { AmplifyMigrationRefactorStep } from '../../../commands/gen2-migration/refactor';
import { REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY } from '../../../commands/gen2-migration/_common/cfn';
import { MigrationApp, MigrationAppOptions } from './_framework/app';
import { Gen1App } from '../../../commands/gen2-migration/_common/gen1-app';
import { SpinningLogger } from '../../../commands/gen2-migration/_common/spinning-logger';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_common/validations';
import * as fs from 'fs-extra';
import * as path from 'path';

// high to allow for debugging in the IDE
const TIMEOUT_MINUTES = 60;

jest.setTimeout(60 * 1000 * TIMEOUT_MINUTES);

// Mock SDK waiters to resolve immediately. The underlying DescribeStacks/DescribeStackRefactor
// mocks return the correct terminal status, but the SDK waiters have a 30-second minDelay
// between polls. With multiple refactor operations per test, this adds minutes of dead time.
jest.mock('@aws-sdk/client-cloudformation', () => {
  const actual = jest.requireActual('@aws-sdk/client-cloudformation');
  return {
    ...actual,
    waitUntilStackUpdateComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackCreateComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackDeleteComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackImportComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackRefactorCreateComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackRefactorExecuteComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilChangeSetCreateComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
  };
});

// fs-extra is (for some reason) globally mocked in tests via the __mocks__ directory.
// unmock it because we actually need the proper implementation.
// note that this must be declared in the top level since jest will hoist it such that it
// executes prior to any module loading.
jest.unmock('fs-extra');

beforeEach(() => {});

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

test('mood-board snapshot', async () => {
  await testSnapshot('mood-board');
});

test('fitness-tracker snapshot', async () => {
  await testSnapshot('fitness-tracker');
});

test('imported-resources snapshot', async () => {
  await testSnapshot('imported-resources');
});

test('store-locator snapshot', async () => {
  await testSnapshot('store-locator');
});

test('media-vault snapshot', async () => {
  await testSnapshot('media-vault');
});

async function testSnapshot(appName: string, appOptions?: MigrationAppOptions, customize?: (app: MigrationApp) => Promise<void>) {
  await MigrationApp.run(
    appName,
    async (app: MigrationApp) => {
      if (customize) {
        await customize(app);
      }

      const context: any = { parameters: { options: { to: findGen2RootStackName(app) } } };
      const gen1App = app.createGen1App();
      const refactorStep = new AmplifyMigrationRefactorStep(app.logger, gen1App, context, {} as AmplifyGen2MigrationValidations);

      const plan = await refactorStep.forward();
      await plan.execute();

      const isUpdatingSnapshots = process.env.UPDATE_SNAPSHOTS === '1' || expect.getState().snapshotState._updateSnapshot === 'all';
      const actualPath = path.join(process.cwd(), REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY);
      const report = await app.snapshots.refactor.compare(actualPath);

      if (report.hasChanges) {
        report.print();
        if (isUpdatingSnapshots) {
          app.snapshots.refactor.update(actualPath);
        }
      }

      expect(report.hasChanges).toBeFalsy();
    },
    appOptions,
  );
}

function findGen2RootStackName(app: MigrationApp) {
  const templateFiles = fs.readdirSync(app.snapshots.refactor.props.inputPath).filter((f) => f.endsWith('.template.json'));
  for (const templateFile of templateFiles) {
    const parts = templateFile.split('-');
    // e.g amplify-discussions-gen2main-branch-98f0e8969c
    // all other stacks are nested and have more parts.
    if (parts.length === 5) {
      return templateFile.replace('.template.json', '');
    }
  }
  throw new Error(`Unable to find Gen2 root stack name for app: ${app.name}`);
}

/** Creates a minimal mock Gen1App for unit tests. */
function mockGen1App(overrides: Partial<Gen1App> = {}): Gen1App {
  return {
    appId: 'app-123',
    appName: 'test-app',
    region: 'us-east-1',
    envName: 'dev',
    rootStackName: 'root-stack',
    discover: () => [],
    categoryMeta: () => undefined,
    fileExists: () => false,
    ...overrides,
  } as unknown as Gen1App;
}

function mockCreateInfrastructure(): jest.SpyInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mocking private method for unit tests
  return jest.spyOn(AmplifyMigrationRefactorStep.prototype as any, 'createInfrastructure').mockResolvedValue({
    clients: {},
    accountId: '123456789012',
    gen1Env: {},
    gen2Branch: {},
    cfn: {},
  });
}

function createStep(gen1App: Gen1App, toStack = 'gen2-stack'): AmplifyMigrationRefactorStep {
  const logger = new SpinningLogger('refactor', { debug: true });
  const context = { parameters: { options: { to: toStack } } } as unknown as $TSContext;
  return new AmplifyMigrationRefactorStep(logger, gen1App, context, {} as AmplifyGen2MigrationValidations);
}

describe('AmplifyMigrationRefactorStep', () => {
  let infraSpy: jest.SpyInstance;

  afterEach(() => {
    infraSpy?.mockRestore();
  });

  describe('forward()', () => {
    it('fails validation when assessment contains unsupported resources', async () => {
      infraSpy = mockCreateInfrastructure();
      const gen1 = mockGen1App({
        discover: () => [{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'UNKNOWN' }],
      });
      const step = createStep(gen1);

      const plan = await step.forward();
      const passed = await plan.validate();
      expect(passed).toBe(false);
    });

    it('passes validation for supported resources', async () => {
      infraSpy = mockCreateInfrastructure();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mocking private method for unit tests
      const lockSpy = jest.spyOn(AmplifyMigrationRefactorStep.prototype as any, 'validateLockStatus').mockResolvedValue({ valid: true });
      const gen1 = mockGen1App({
        discover: () => [{ category: 'geo', resourceName: 'myMap', service: 'Map', key: 'geo:Map' }],
      });
      const step = createStep(gen1);

      const plan = await step.forward();
      const passed = await plan.validate();
      expect(passed).toBe(true);
      lockSpy.mockRestore();
    });

    it('skips imported auth resources', async () => {
      infraSpy = mockCreateInfrastructure();
      const gen1 = mockGen1App({
        discover: () => [{ category: 'auth', resourceName: 'myImportedPool', service: 'Cognito', key: 'auth:Cognito' }],
        categoryMeta: (category: string) =>
          category === 'auth' ? { myImportedPool: { service: 'Cognito', serviceType: 'imported' } } : undefined,
      });

      const step = createStep(gen1);
      const plan = await step.forward();
      await plan.describe();
    });

    it('skips imported storage resources', async () => {
      infraSpy = mockCreateInfrastructure();
      const gen1 = mockGen1App({
        discover: () => [
          { category: 'storage', resourceName: 'myImportedBucket', service: 'S3', key: 'storage:S3' },
          { category: 'storage', resourceName: 'myImportedTable', service: 'DynamoDB', key: 'storage:DynamoDB' },
        ],
        categoryMeta: (category: string) =>
          category === 'storage'
            ? {
                myImportedBucket: { service: 'S3', serviceType: 'imported' },
                myImportedTable: { service: 'DynamoDB', serviceType: 'imported' },
              }
            : undefined,
      });

      const step = createStep(gen1);
      const plan = await step.forward();
      await plan.describe();
    });
  });

  describe('rollback()', () => {
    it('fails validation when assessment contains unsupported resources', async () => {
      infraSpy = mockCreateInfrastructure();
      const gen1 = mockGen1App({
        discover: () => [{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'UNKNOWN' }],
      });
      const step = createStep(gen1);

      const plan = await step.rollback();
      const passed = await plan.validate();
      expect(passed).toBe(false);
    });

    it('passes validation for supported resources', async () => {
      infraSpy = mockCreateInfrastructure();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mocking private method for unit tests
      const lockSpy = jest.spyOn(AmplifyMigrationRefactorStep.prototype as any, 'validateLockStatus').mockResolvedValue({ valid: true });
      const gen1 = mockGen1App({
        discover: () => [{ category: 'geo', resourceName: 'myMap', service: 'Map', key: 'geo:Map' }],
      });
      const step = createStep(gen1);

      const plan = await step.rollback();
      const passed = await plan.validate();
      expect(passed).toBe(true);
      lockSpy.mockRestore();
    });

    it('skips imported auth resources', async () => {
      infraSpy = mockCreateInfrastructure();
      const gen1 = mockGen1App({
        discover: () => [{ category: 'auth', resourceName: 'myImportedPool', service: 'Cognito', key: 'auth:Cognito' }],
        categoryMeta: (category: string) =>
          category === 'auth' ? { myImportedPool: { service: 'Cognito', serviceType: 'imported' } } : undefined,
      });

      const step = createStep(gen1);
      const plan = await step.rollback();
      await plan.describe();
    });

    it('skips imported storage resources', async () => {
      infraSpy = mockCreateInfrastructure();
      const gen1 = mockGen1App({
        discover: () => [
          { category: 'storage', resourceName: 'myImportedBucket', service: 'S3', key: 'storage:S3' },
          { category: 'storage', resourceName: 'myImportedTable', service: 'DynamoDB', key: 'storage:DynamoDB' },
        ],
        categoryMeta: (category: string) =>
          category === 'storage'
            ? {
                myImportedBucket: { service: 'S3', serviceType: 'imported' },
                myImportedTable: { service: 'DynamoDB', serviceType: 'imported' },
              }
            : undefined,
      });

      const step = createStep(gen1);
      const plan = await step.rollback();
      await plan.describe();
    });
  });
});
