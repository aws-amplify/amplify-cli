require('../src/aws-matchers/'); // custom matcher for assertion
import { initJSProjectWithProfile } from '../src/init';
import { addAnalytics, removeAnalytics } from '../src/categories/analytics';
import { createNewProjectDir, deleteProjectDir } from '../src/utils';
import * as fs from 'fs';
import * as path from 'path';

describe('amplify add analytics', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
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
