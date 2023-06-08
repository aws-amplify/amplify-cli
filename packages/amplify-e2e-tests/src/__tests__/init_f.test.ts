/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  initJSProjectWithProfile,
  deleteProject,
  createNewProjectDir,
  deleteProjectDir,
  getProjectMeta,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify init f', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('init');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('should fail if init is not executed in project root', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const meta = getProjectMeta(projRoot).providers.awscloudformation;
    expect(meta.Region).toBeDefined();

    const nestedRoot = path.join(projRoot, 'foo');
    await fs.ensureDir(nestedRoot);
    await expect(initJSProjectWithProfile(nestedRoot, { failureExpected: true })).rejects.toThrowError(
      'Process exited with non zero exit code 1',
    );
  });
});
