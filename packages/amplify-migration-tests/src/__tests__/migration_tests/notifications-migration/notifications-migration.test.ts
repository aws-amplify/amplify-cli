import {
  addNotificationChannel,
  addPinpointAnalytics,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { initJSProjectWithProfileV4_52_0, versionCheck } from '../../../migration-helpers';
import { getShortId } from '../../../migration-helpers/utils';

describe('amplify add notifications', () => {
  let projectRoot: string;
  const migrateFromVersion = { v: '10.0.0' };
  const migrateToVersion = { v: 'uninitialized' };

  beforeEach(async () => {
    projectRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projectRoot, undefined, true);
    deleteProjectDir(projectRoot);
  });

  beforeAll(async () => {
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
  });

  it('should add in app notifications if analytics added with an older version', async () => {
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);

    await initJSProjectWithProfileV4_52_0(projectRoot, {}, false);
    await addPinpointAnalytics(projectRoot, false);

    const settings = { resourceName: `notification${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, 'In-App Messaging', true, true, true);

    await amplifyPushAuth(projectRoot, true);
  });

  it('should add in app notifications if analytics added and pushed with an older version', async () => {
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);

    await initJSProjectWithProfileV4_52_0(projectRoot, {}, false);
    await addPinpointAnalytics(projectRoot, false);
    await amplifyPushAuth(projectRoot, false);

    const settings = { resourceName: `notification${getShortId()}` };
    await addNotificationChannel(projectRoot, settings, 'In-App Messaging', true, true, true);

    await amplifyPushAuth(projectRoot, true);
  });
});
