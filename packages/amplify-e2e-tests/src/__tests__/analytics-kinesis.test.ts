import {
  initJSProjectWithProfile,
  amplifyPushUpdate,
  deleteProject,
  generateRandomShortId,
  addKinesis,
  removeAnalytics,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add analytics', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('analytics');
  });

  afterEach(async () => {
    await removeAnalytics(projRoot);
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add kinesis', async () => {
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    const rightName = `myapp${generateRandomShortId()}`;
    await addKinesis(projRoot, { rightName, wrongName: '$' });
    await amplifyPushUpdate(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'analytics', rightName))).toBe(true);
  });
});
