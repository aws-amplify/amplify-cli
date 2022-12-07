import {
    addAuthWithDefault,
    amplifyPull,
    checkIfBucketExists,
    createNewProjectDir,
    deleteProject,
    deleteProjectDir,
    getProjectMeta,
    initJSProjectWithProfile,
    getAppId,
  } from '@aws-amplify/amplify-e2e-core';
  import {
    listEnvironment,
    pullEnvironment
  } from '../environment/env';
    
  const validate = async (meta: any) : Promise<void> => {
    expect(meta.providers.awscloudformation).toBeDefined();
    const {
      AuthRoleArn: authRoleArn, DeploymentBucketName: bucketName, Region: region, StackId: stackId,
    } = meta.providers.awscloudformation;
  
    expect(authRoleArn).toBeDefined();
    expect(region).toBeDefined();
    expect(stackId).toBeDefined();
    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});
  };
    
  describe('pull env and answer no to changes', () => {
    let projRoot: string;
    let projRoot2: string;
    beforeEach(async () => {
      projRoot = await createNewProjectDir('pull-answer-no-test');
      projRoot2 = await createNewProjectDir('pull-answer-no-test-2');
    });
  
    afterEach(async () => {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
      deleteProjectDir(projRoot2);
    });
  
    it('init a project, change to empty dir, pull and answer no', async () => {
      await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
      const appId = getAppId(projRoot);
      await amplifyPull(projRoot2, { override: false, noUpdateBackend: true, emptyDir: true, appId: appId });
      const meta = getProjectMeta(projRoot);
      await validate(meta);
    });
  
    it('init a project, change to empty dir, env list, env pull and answer no', async () => {
      await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
      const meta = getProjectMeta(projRoot);
      await validate(meta);
      const appId = getAppId(projRoot);
      await amplifyPull(projRoot2, { override: false, noUpdateBackend: true, emptyDir: true, appId });
      await listEnvironment(projRoot2, {});
      await pullEnvironment(projRoot2, { appId, envName: 'dir' });
      await listEnvironment(projRoot2, { numEnv: 2 });
    });
  
    it('init a project, pull env that does not exist', async () => {
      await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
      const meta = getProjectMeta(projRoot);
      await validate(meta);
      const appId = getAppId(projRoot);
  
      var failed = false;
      try {
        await pullEnvironment(projRoot, { appId, envName: 'doesnotexist' });
      } catch (e) {
        failed = true;
      }
  
      expect(failed).toBe(true);
    });
  });