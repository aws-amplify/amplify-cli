import { initJSProjectWithProfile, deleteProject } from '../init';
import {
  addHosting,
  removeHosting,
  amplifyPushWithUpdate,
  amplifyPublishWithoutUpdate,
  createReactTestProject,
  resetBuildCommand,
} from '../categories/hosting';
import { deleteProjectDir, getProjectMeta } from '../utils';

describe('amplify add hosting', () => {
  let projRoot: string;

  beforeAll(async () => {
    projRoot = await createReactTestProject();
    await initJSProjectWithProfile(projRoot, {});
    await addHosting(projRoot);
    await amplifyPushWithUpdate(projRoot);
  });

  afterAll(async () => {
    await removeHosting(projRoot);
    await amplifyPushWithUpdate(projRoot);
    await deleteProject(projRoot, true);
    deleteProjectDir(projRoot);
  });

  beforeEach(async () => {});

  afterEach(async () => {});

  it('publish', async () => {
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
