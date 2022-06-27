import {
  addRestContainerApi,
  amplifyConfigureProject,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getProjectMeta,
  modifyRestAPI,
  generateRandomShortId,
} from 'amplify-e2e-core';

const setupAmplifyProject = async (cwd: string): Promise<void> => {
  await amplifyConfigureProject({
    cwd,
    enableContainers: true,
  });
};

describe('amplify api add', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('containers');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, enable containers and add multi-container api push, edit and push', async () => {
    const envName = 'devtest';
    const apiName = `containermodifyapi${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: `multict${generateRandomShortId()}`, envName });
    await setupAmplifyProject(projRoot);
    await addRestContainerApi(projRoot, { apiName });
    await amplifyPushWithoutCodegen(projRoot);
    const meta = await getProjectMeta(projRoot);
    const api = Object.keys(meta.api)[0];
    modifyRestAPI(projRoot, api);
    await amplifyPushWithoutCodegen(projRoot);
  });
});
