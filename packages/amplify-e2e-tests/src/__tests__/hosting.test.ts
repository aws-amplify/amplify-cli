import { amplifyPublishWithoutUpdate, createReactTestProject, resetBuildCommand } from 'amplify-e2e-core';

import { initJSProjectWithProfile, deleteProject } from 'amplify-e2e-core';
import { addDEVHosting, removeHosting, amplifyPushWithoutCodegen } from 'amplify-e2e-core';
import { deleteProjectDir, getProjectMeta } from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('amplify add hosting', () => {
  let projRoot: string;

  beforeAll(async () => {
    projRoot = await createReactTestProject();
    await initJSProjectWithProfile(projRoot, {});
    await addDEVHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
  });

  afterAll(async () => {
    await removeHosting(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  it('push creates correct amplify artifacts', async () => {
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'hosting', 'S3AndCloudFront'))).toBe(true);
    const projectMeta = getProjectMeta(projRoot);
    expect(projectMeta.hosting).toBeDefined();
    expect(projectMeta.hosting.S3AndCloudFront).toBeDefined();
  });

  it('publish successfuly', async () => {
    let error;
    try {
      await amplifyPublishWithoutUpdate(projRoot);
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeDefined();
  });

  it('publish throws error if build command is missing', async () => {
    const currentBuildCommand = resetBuildCommand(projRoot, '');
    let error;
    try {
      await amplifyPublishWithoutUpdate(projRoot);
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.message).toEqual('Process exited with non zero exit code 1');
    resetBuildCommand(projRoot, currentBuildCommand);
  });
});
