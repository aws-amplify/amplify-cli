import {
  addFunction,
  addRestApi,
  addSimpleDDB,
  amplifyPushUpdate,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  listAttachedRolePolicies,
  listRolePolicies,
  updateAuthAddAdminQueries,
} from 'amplify-e2e-core';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');
// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

describe('amplify add api (REST)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('rest-api');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  const validateMeta = async (meta?) => {
    meta = meta ?? getProjectMeta(projRoot);
    expect(meta.providers.awscloudformation).toBeDefined();
    const {
      AuthRoleArn: authRoleArn,
      UnauthRoleArn: unauthRoleArn,
      DeploymentBucketName: bucketName,
      Region: region,
      StackId: stackId,
    } = meta.providers.awscloudformation;
    expect(authRoleArn).toBeDefined();
    expect(unauthRoleArn).toBeDefined();
    expect(region).toBeDefined();
    expect(stackId).toBeDefined();
    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});

    expect(meta.function).toBeDefined();
    let seenAtLeastOneFunc = false;
    for (let key of Object.keys(meta.function)) {
      const { service, build, lastBuildTimeStamp, lastPackageTimeStamp, distZipFilename, lastPushTimeStamp, lastPushDirHash } =
        meta.function[key];
      expect(service).toBe('Lambda');
      expect(build).toBeTruthy();
      expect(lastBuildTimeStamp).toBeDefined();
      expect(lastPackageTimeStamp).toBeDefined();
      expect(distZipFilename).toBeDefined();
      expect(lastPushTimeStamp).toBeDefined();
      expect(lastPushDirHash).toBeDefined();
      seenAtLeastOneFunc = true;
    }
    expect(seenAtLeastOneFunc).toBe(true);
  };

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
    validateMeta(meta);
  });

  it('init a project, then add a serverless rest api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addRestApi(projRoot, { isCrud: false });
    await amplifyPushUpdate(projRoot);
    validateMeta();
  });

  it('init a project, create lambda and attach it to an api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true });
    await amplifyPushUpdate(projRoot);
    validateMeta();
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

    validateMeta(amplifyMeta);
  });

});
