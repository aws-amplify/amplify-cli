import { initJSProjectWithProfile } from '../init';
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
    deleteProjectDir(projRoot);
  });

  it('add analytics', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const rightName = 'my-app';
    await addAnalytics(projRoot, { rightName, wrongName: 'my=app' });
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'analytics', rightName))).toBe(true);
  });
});
