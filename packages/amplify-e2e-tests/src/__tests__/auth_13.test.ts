import {
  addAuthWithOidcForNonJSProject,
  addRestApi,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  get,
  getCLIInputsJson,
  getProjectMeta,
  initAndroidProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

describe('auth with OIDC enabled', () => {
  const shortId = generateRandomShortId();
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir(`auth${shortId}`);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('can be created with an Android project', async () => {
    await initAndroidProjectWithProfile(projRoot, {});
    const authName = `oidctest${shortId}`;
    await addAuthWithOidcForNonJSProject(projRoot, { resourceName: authName });
    await amplifyPushAuth(projRoot);

    const inputs = getCLIInputsJson(projRoot, 'auth', authName);
    expect(inputs?.cognitoConfig?.thirdPartyAuth).toBe(true);
    expect(inputs?.cognitoConfig?.audiences?.length).toBe(2);

    const apiName = `testRestApi${shortId}`;
    await addRestApi(projRoot, { apiName, restrictAccess: true, hasUserPoolGroups: true });
    await amplifyPushAuth(projRoot);

    const projMeta = getProjectMeta(projRoot);
    const region = projMeta?.providers?.awscloudformation?.Region;
    expect(region).toBeDefined();
    expect(projMeta?.auth?.[authName]).toBeDefined();
    expect(projMeta?.api?.[apiName]?.output?.RootUrl).toBeDefined();

    const userPoolId = projMeta.auth[authName]?.output?.UserPoolId;
    expect(userPoolId).toBeDefined();

    const rootUrl = projMeta.api[apiName].output.RootUrl;
    let itemsResponse = await get(`${rootUrl}/items`);

    expect(await itemsResponse.json()).toEqual({ message: 'Missing Authentication Token' }); // Restricted API
  });
});
