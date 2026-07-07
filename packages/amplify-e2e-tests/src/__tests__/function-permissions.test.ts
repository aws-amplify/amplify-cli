import {
  addNotificationChannel,
  addFunction,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { getShortId } from '../import-helpers';

describe('amplify add function with permissions', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('function-permissions');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add notifications and function permissions', async () => {
    await initJSProjectWithProfile(projRoot, {});

    const settings = { resourceName: `notifications${getShortId()}` };
    await addNotificationChannel(projRoot, settings, 'SMS');
    await addFunction(
      projRoot,
      {
        name: 'testFunction',
        functionTemplate: 'Hello World',
        additionalPermissions: {
          permissions: ['notifications'],
          resources: [settings.resourceName],
          choices: ['auth', 'analytics', 'notifications'],
          operations: ['create', 'read'],
        },
      },
      'nodejs',
    );
    await amplifyPushUpdate(projRoot);
  });
});
