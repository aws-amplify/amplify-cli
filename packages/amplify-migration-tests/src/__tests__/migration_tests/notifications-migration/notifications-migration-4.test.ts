import {
  amplifyPull,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppId,
} from '@aws-amplify/amplify-e2e-core';
import { initJSProjectWithProfile, versionCheck } from '../../../migration-helpers';
import { addLegacySmsNotificationChannel, removeLegacyAllNotificationChannel } from '../../../migration-helpers/notifications-helpers';
import { getShortId } from '../../../migration-helpers/utils';

describe('amplify add notifications', () => {
  let projectRoot: string;
  const migrateFromVersion = { v: '10.0.0' };
  const migrateToVersion = { v: 'uninitialized' };

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('notification-migration-4');
  });

  afterEach(async () => {
    await deleteProject(projectRoot, undefined, true);
    deleteProjectDir(projectRoot);
  });

  beforeAll(async () => {
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
  });

  it('should pull app if notifications added and removed with an older version', async () => {
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    const settings = { resourceName: `notification${getShortId()}` };

    await initJSProjectWithProfile(projectRoot, { disableAmplifyAppCreation: false }, false);
    const appId = getAppId(projectRoot);
    expect(appId).toBeDefined();

    await addLegacySmsNotificationChannel(projectRoot, settings.resourceName);
    await amplifyPushAuth(projectRoot, false);

    await removeLegacyAllNotificationChannel(projectRoot);
    const projectRootPull = await createNewProjectDir('removed-notifications-pull');
    try {
      await amplifyPull(projectRootPull, { override: false, emptyDir: true, appId }, true);
    } finally {
      deleteProjectDir(projectRootPull);
    }
  });
});
