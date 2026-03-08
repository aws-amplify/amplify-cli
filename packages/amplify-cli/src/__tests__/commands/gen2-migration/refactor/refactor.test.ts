import { AmplifyMigrationRefactorStep } from '../../../../commands/gen2-migration/refactor';
import { OUTPUT_DIRECTORY } from '../../../../commands/gen2-migration/refactor/snap';
import { MigrationApp, MigrationAppOptions } from '../_framework/app';
import * as fs from 'fs-extra';
import * as path from 'path';

// high to allow for debugging in the IDE
const TIMEOUT_MINUTES = 60;

jest.setTimeout(60 * 1000 * TIMEOUT_MINUTES);

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

      for (const operation of await refactorStep.execute()) {
        await operation.execute();
      }

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
