import { initJSProjectWithProfile, amplifyPushUpdate, deleteProject } from '../init';
import { addPinpoint, addKinesis, removeAnalytics } from '../categories/analytics';
import { createNewProjectDir, deleteProjectDir } from '../utils';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add analytics', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('analytics');
  });

  afterEach(async () => {
    await removeAnalytics(projRoot, {});
    await deleteProject(projRoot, true);
    deleteProjectDir(projRoot);
  });

  it('add pinpoint', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const rightName = 'myapp';
    await addPinpoint(projRoot, { rightName, wrongName: '$' });
    await amplifyPushUpdate(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'analytics', rightName))).toBe(true);
  });

  it('add kinesis', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const rightName = 'myapp';
    await addKinesis(projRoot, { rightName, wrongName: '$' });
    await amplifyPushUpdate(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'analytics', rightName))).toBe(true);
  });
});
