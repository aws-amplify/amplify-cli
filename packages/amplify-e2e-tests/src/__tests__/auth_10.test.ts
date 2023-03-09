import {
  addAuthWithDefault,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendConfig,
  initJSProjectWithProfile,
  updateAuthMFAConfiguration,
} from '@aws-amplify/amplify-e2e-core';

const defaultsSettings = {
  name: 'authTest',
};

describe('amplify update auth', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('auth');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('...should update backend-config.json on auth update', async () => {
    await initJSProjectWithProfile(projRoot, defaultsSettings);
    await addAuthWithDefault(projRoot);
    const backendConfigBefore = await getBackendConfig(projRoot);

    await updateAuthMFAConfiguration(projRoot, {});
    const backendConfigAfter = await getBackendConfig(projRoot);

    expect(backendConfigBefore).toBeDefined();
    const beforeMFAConfiguration = (Object.values(backendConfigBefore.auth)[0] as any).frontendAuthConfig.mfaConfiguration;
    expect(beforeMFAConfiguration).toEqual('OFF');

    expect(backendConfigAfter).toBeDefined();
    const afterMFAConfiguration = (Object.values(backendConfigAfter.auth)[0] as any).frontendAuthConfig.mfaConfiguration;
    expect(afterMFAConfiguration).toEqual('OPTIONAL');
  });
});
