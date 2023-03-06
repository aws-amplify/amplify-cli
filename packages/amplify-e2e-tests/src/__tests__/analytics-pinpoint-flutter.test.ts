import {
  initFlutterProjectWithProfile,
  amplifyPushUpdate,
  deleteProject,
  addPinpoint,
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

  it('add pinpoint for flutter', async () => {
    await initFlutterProjectWithProfile(projRoot, { name: 'storageTest' });
    const rightName = 'myapp';
    await addPinpoint(projRoot, { rightName, wrongName: '$' });
    await amplifyPushUpdate(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'lib', 'amplifyconfiguration.dart'))).toBe(true);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'analytics', rightName))).toBe(true);
  });
});
