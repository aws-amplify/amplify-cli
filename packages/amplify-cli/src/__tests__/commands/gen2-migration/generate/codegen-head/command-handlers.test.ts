import { prepare } from '../../../../../commands/gen2-migration/generate/codegen-head/command-handlers';
import { MigrationApp } from '../../migration-app';

// high to allow for debugging in the IDE
const TIMEOUT_MINUTES = 60;

jest.setTimeout(60 * 1000 * TIMEOUT_MINUTES);

// fs-extra is (for some reason) globally mocked in tests via the __mocks__ directory.
// unmock it because we actually need the proper implementation.
// note that this must be declared in the top level since jest will hoist it such that it
// executes prior to any module loading.
jest.unmock('fs-extra');

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

describe('prepare', () => {
  describe('migration apps snapshot', () => {
    test('project-boards', async () => {
      const appName = 'project-boards';

      await MigrationApp.with(appName, async (app: MigrationApp) => {
        await prepare(app.logger, app.id, app.environmentName, app.region);

        const snapshot = await app.compare(process.cwd());

        const isUpdatingSnapshots = expect.getState().snapshotState._updateSnapshot === 'all';

        if (snapshot.changed) {
          console.log(snapshot.report());
        }

        if (isUpdatingSnapshots) {
          snapshot.update();
        }

        expect(snapshot.changed).toBeFalsy();
      });
    });
  });
});
