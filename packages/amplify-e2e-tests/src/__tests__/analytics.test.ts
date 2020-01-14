import { initJSProjectWithProfile, amplifyPushUpdate, deleteProject } from '../init';
import { addAnalytics, removeAnalytics } from '../categories/analytics';
import { createNewProjectDir, deleteProjectDir } from '../utils';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add analytics', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    await removeAnalytics(projRoot, {});
    await deleteProject(projRoot, true);
    deleteProjectDir(projRoot);
  });

  it('add analytics', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const rightName = 'myapp';
    await addAnalytics(projRoot, { rightName, wrongName: '$' });
    await amplifyPushUpdate(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'analytics', rightName))).toBe(true);
  });
});
