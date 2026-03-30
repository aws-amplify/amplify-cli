import { AmplifyMigrationRefactorStep } from '../../../../commands/gen2-migration/refactor';
import { OUTPUT_DIRECTORY } from '../../../../commands/gen2-migration/refactor/cfn';
import { MigrationApp, MigrationAppOptions } from '../_framework/app';
import { Gen1App, DiscoveredResource } from '../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { Assessment } from '../../../../commands/gen2-migration/_assessment';
import { SpinningLogger } from '../../../../commands/gen2-migration/_spinning-logger';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
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

async function testSnapshot(appName: string, appOptions?: MigrationAppOptions, customize?: (app: MigrationApp) => Promise<void>) {
  await MigrationApp.run(
    appName,
    async (app: MigrationApp) => {
      if (customize) {
        await customize(app);
      }

      const context: any = { parameters: { options: { to: findGen2RootStackName(app) } } };
      const refactorStep = new AmplifyMigrationRefactorStep(
        app.logger,
        app.environmentName,
        app.name,
        app.id,
        app.rootStackName,
        app.region,
        context,
      );

      const plan = await refactorStep.forward();
      await plan.execute();

      const isUpdatingSnapshots = expect.getState().snapshotState._updateSnapshot === 'all';
      const actualPath = path.join(process.cwd(), OUTPUT_DIRECTORY);
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

function mockDiscover(resources: DiscoveredResource[], metaOverrides?: Record<string, unknown>): jest.SpyInstance {
  return jest.spyOn(Gen1App, 'create').mockResolvedValue({
    discover: () => resources,
    meta: (category: string) => metaOverrides?.[category] as Record<string, unknown> | undefined,
  } as unknown as Gen1App);
}

function mockCreateInfrastructure(): jest.SpyInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mocking private method for unit tests
  return jest.spyOn(AmplifyMigrationRefactorStep.prototype as any, 'createInfrastructure').mockResolvedValue({
    clients: {},
    accountId: '123456789012',
    gen1Env: {},
    gen2Branch: {},
  });
}

function createStep(toStack = 'gen2-stack'): AmplifyMigrationRefactorStep {
  const logger = new SpinningLogger('refactor', { debug: true });
  const context = { parameters: { options: { to: toStack } } } as unknown as $TSContext;
  return new AmplifyMigrationRefactorStep(logger, 'dev', 'test-app', 'app-123', 'root-stack', 'us-east-1', context);
}

describe('AmplifyMigrationRefactorStep', () => {
  let createSpy: jest.SpyInstance;
  let infraSpy: jest.SpyInstance;

  afterEach(() => {
    createSpy?.mockRestore();
    infraSpy?.mockRestore();
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
        expect(recordSpy).toHaveBeenCalledWith('refactor', expect.objectContaining({ resourceName: name }), {
          supported: true,
        });
      }

      recordSpy.mockRestore();
    });

    it('records unsupported key as not supported', async () => {
      createSpy = mockDiscover([{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'unsupported' }]);

      const recordSpy = jest.spyOn(Assessment.prototype, 'record');
      const step = createStep();
      await step.assess(new Assessment('test-app', 'dev'));

      expect(recordSpy).toHaveBeenCalledWith('refactor', expect.objectContaining({ resourceName: 'push' }), {
        supported: false,
      });

      recordSpy.mockRestore();
    });

    it('records Cognito-UserPool-Groups as supported', async () => {
      createSpy = mockDiscover([
        { category: 'auth', resourceName: 'userPoolGroups', service: 'Cognito-UserPool-Groups', key: 'auth:Cognito-UserPool-Groups' },
      ]);

      const recordSpy = jest.spyOn(Assessment.prototype, 'record');
      const step = createStep();
      await step.assess(new Assessment('test-app', 'dev'));

      expect(recordSpy).toHaveBeenCalledWith('refactor', expect.objectContaining({ resourceName: 'userPoolGroups' }), {
        supported: true,
      });

      recordSpy.mockRestore();
    });
  });

  describe('execute()', () => {
    it('throws on unsupported resource key', async () => {
      infraSpy = mockCreateInfrastructure();
      createSpy = mockDiscover([{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'unsupported' }]);

      const step = createStep();
      await expect(step.forward()).rejects.toThrow(/Unsupported resource 'push'/);
    });

    it('does not throw for stateless-only resources', async () => {
      infraSpy = mockCreateInfrastructure();
      createSpy = mockDiscover([
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
        { category: 'api', resourceName: 'myApi', service: 'AppSync', key: 'api:AppSync' },
      ]);

      const step = createStep();
      const plan = await step.forward();
      await plan.describe();
    });

    it('skips imported auth resources', async () => {
      infraSpy = mockCreateInfrastructure();
      createSpy = mockDiscover([{ category: 'auth', resourceName: 'myImportedPool', service: 'Cognito', key: 'auth:Cognito' }], {
        auth: { myImportedPool: { service: 'Cognito', serviceType: 'imported' } },
      });

      const step = createStep();
      const plan = await step.forward();
      await plan.describe();
    });
  });

  describe('rollback()', () => {
    it('throws on unsupported resource key', async () => {
      infraSpy = mockCreateInfrastructure();
      createSpy = mockDiscover([{ category: 'notifications', resourceName: 'push', service: 'Pinpoint', key: 'unsupported' }]);

      const step = createStep();
      await expect(step.rollback()).rejects.toThrow(/Unsupported resource 'push'/);
    });

    it('does not throw for stateless-only resources', async () => {
      infraSpy = mockCreateInfrastructure();
      createSpy = mockDiscover([
        { category: 'function', resourceName: 'myFunc', service: 'Lambda', key: 'function:Lambda' },
        { category: 'api', resourceName: 'myGateway', service: 'API Gateway', key: 'api:API Gateway' },
      ]);

      const step = createStep();
      const plan = await step.rollback();
      await plan.describe();
    });

    it('skips imported auth resources', async () => {
      infraSpy = mockCreateInfrastructure();
      createSpy = mockDiscover([{ category: 'auth', resourceName: 'myImportedPool', service: 'Cognito', key: 'auth:Cognito' }], {
        auth: { myImportedPool: { service: 'Cognito', serviceType: 'imported' } },
      });

      const step = createStep();
      const plan = await step.rollback();
      await plan.describe();
    });
  });
});
