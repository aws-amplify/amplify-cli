import {
  addFunction,
  addRestApi,
  addSimpleDDB,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  listAttachedRolePolicies,
  listRolePolicies,
  updateAuthAddAdminQueries,
  validateRestApiMeta,
} from '@aws-amplify/amplify-e2e-core';

describe('amplify add api (REST)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('rest-api');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add a DDB, then add a crud rest api', async () => {
    const randomId = await global.getRandomId();
    const DDB_NAME = `ddb${randomId}`;
    await initJSProjectWithProfile(projRoot, {});
    await addSimpleDDB(projRoot, { name: DDB_NAME });
    await addRestApi(projRoot, { isCrud: true, projectContainsFunctions: false });
    await amplifyPushUpdate(projRoot);

    const meta = getProjectMeta(projRoot);
    expect(meta.storage[DDB_NAME]).toBeDefined();
    const { service, lastPushTimeStamp, lastPushDirHash } = meta.storage[DDB_NAME];
    expect(service).toBe('DynamoDB');
    expect(lastPushTimeStamp).toBeDefined();
    expect(lastPushDirHash).toBeDefined();
    await validateRestApiMeta(projRoot, meta);
  });

  it('init a project, then add a serverless rest api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addRestApi(projRoot, { isCrud: false });
    await amplifyPushUpdate(projRoot);
    await validateRestApiMeta(projRoot);
  });

  it('init a project, create lambda and attach it to an api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true });
    await amplifyPushUpdate(projRoot);
    await validateRestApiMeta(projRoot);
  });

  it('init a project, create lambda and attach multiple rest apis', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, {
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: true,
    });
    await addRestApi(projRoot, {
      isFirstRestApi: false,
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: true,
    });
    await addRestApi(projRoot, {
      isFirstRestApi: false,
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: false,
    });

    // add more paths to and test policy slicing
    for (let i = 0; i < 15; i++) {
      await addRestApi(projRoot, {
        path: `/items${i}`,
        isFirstRestApi: false,
        existingLambda: true,
        restrictAccess: true,
        allowGuestUsers: true,
      });
    }
    await addRestApi(projRoot, { isFirstRestApi: false, existingLambda: true });
    await updateAuthAddAdminQueries(projRoot, undefined, {});
    await amplifyPushUpdate(projRoot);

    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const { AuthRoleName, UnauthRoleName, Region } = meta;

    expect(await listRolePolicies(AuthRoleName, Region)).toEqual([]);
    expect(await listRolePolicies(UnauthRoleName, Region)).toEqual([]);

    const authPolicies = await listAttachedRolePolicies(AuthRoleName, Region);
    expect(authPolicies.length).toBeGreaterThan(0);

    for (const { PolicyName } of authPolicies) {
      expect(PolicyName).toMatch(/PolicyAPIGWAuth\d/);
    }

    const unauthPolicies = await listAttachedRolePolicies(UnauthRoleName, Region);
    expect(unauthPolicies.length).toBeGreaterThan(0);

    for (const { PolicyName } of unauthPolicies) {
      expect(PolicyName).toMatch(/PolicyAPIGWUnauth\d/);
    }

    await validateRestApiMeta(projRoot, amplifyMeta);
  });
});
