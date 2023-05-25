/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable jest/no-standalone-expect */

import {
  addAuthWithDefault,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getUserPool,
  initJSProjectWithProfile,
  updateHeadlessAuth,
} from '@aws-amplify/amplify-e2e-core';
import { UpdateAuthRequest } from 'amplify-headless-interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { versionCheck, allowedVersionsToMigrateFrom } from '../../../migration-helpers';

const defaultSettings = {
  name: 'authMigration',
  includeUsageDataPrompt: false,
};
describe('amplify auth migration e', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth_migration');
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projRoot, undefined, true);
    }
    deleteProjectDir(projRoot);
  });

  it('updates existing auth resource', async () => {
    const updateAuthRequest: UpdateAuthRequest = {
      version: 2,
      serviceModification: {
        serviceName: 'Cognito',
        userPoolModification: {
          userPoolGroups: [
            {
              groupName: 'group1',
            },
            {
              groupName: 'group2',
            },
          ],
        },
        includeIdentityPool: true,
        identityPoolModification: {
          unauthenticatedLogin: true,
        },
      },
    };

    await initJSProjectWithProfile(projRoot, defaultSettings);
    await addAuthWithDefault(projRoot);
    await updateHeadlessAuth(projRoot, updateAuthRequest, { testingWithLatestCodebase: true });
    await amplifyPushAuth(projRoot, true);
    const meta = getProjectMeta(projRoot);
    const id = Object.keys(meta.auth).map((key) => meta.auth[key])[0].output.UserPoolId;
    const userPool = await getUserPool(id, meta.providers.awscloudformation.Region);
    expect(userPool.UserPool).toBeDefined();
    expect(_.get(meta, ['auth', 'userPoolGroups'])).toBeDefined();
  });
});
