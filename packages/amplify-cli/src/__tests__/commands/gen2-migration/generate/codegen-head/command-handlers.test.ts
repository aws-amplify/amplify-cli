import 'aws-sdk-client-mock-jest';
import { prepare, DependenciesInstaller } from '../../../../../commands/gen2-migration/generate/codegen-head/command-handlers';
import { MigrationAppOptions, MigrationApp } from '../../_framework/app';

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
  // if (process.env['GITHUB_ACTION'] !== undefined) {
  //   console.log('Not running test on github actions');
  //   return;
  // }
  await MigrationApp.run(
    appName,
    async (app: MigrationApp) => {
      if (customize) {
        await customize(app);
      }
      await prepare(app.logger, app.id, app.environmentName, app.region);

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
